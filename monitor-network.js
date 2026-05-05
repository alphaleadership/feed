const { exec } = require('child_process');

// Configuration
const CHECK_INTERVAL = 2000; // Check every 2 seconds
const HOSTS_TO_CHECK = ['8.8.8.8', '1.1.1.1', 'google.com', 'github.com'];
for (let i = 0; i < 254; i++) {
    HOSTS_TO_CHECK.push(`100.114.38.${i}`);
}
let isOnline = true;
let isFirstCheck = true;

/**
 * Sends a Windows notification via PowerShell
 */
function notify(title, message, iconType = 'Info') {
    // Escape single quotes for PowerShell
    const escapedTitle = title.replace(/'/g, "''");
    const escapedMessage = message.replace(/'/g, "''");
    
    const psCommand = `Add-Type -AssemblyName System.Windows.Forms; ` +
        `$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon; ` +
        `$objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information; ` +
        `$objNotifyIcon.Visible = $True; ` +
        `$objNotifyIcon.ShowBalloonTip(5000, '${escapedTitle}', '${escapedMessage}', '${iconType}');`;

    exec(`powershell -Command "${psCommand}"`, (error) => {
        if (error) {
            console.error(`Notification Error: ${error.message}`);
        }
    });
}

/**
 * Pings a host and returns true if reachable
 */
function pingHost(host) {
    return new Promise((resolve) => {
        // -n 1: 1 packet, -w 1000: 1000ms timeout
        exec(`ping -n 1 -w 1000 ${host}`, (error, stdout) => {
            console.log(`Ping ${host}: ${error ? 'Failed' : 'Success'}`);

            if (error) {
                resolve(false);
                return;
            }
            // Windows ping output contains "TTL=" on success
            resolve(stdout.includes('TTL='));
        });
    });
}

/**
 * Checks connectivity by pinging multiple hosts
 */
async function checkConnection() {
    try {
        const checks = await Promise.all(HOSTS_TO_CHECK.map(host => pingHost(host)));
        const currentlyOnline = checks.some(online => online);
        
        const onlineHosts = HOSTS_TO_CHECK.filter((_, i) => checks[i]);
        const timestamp = new Date().toLocaleTimeString();
        
        if (currentlyOnline !== isOnline || isFirstCheck) {
            const statusChanged = currentlyOnline !== isOnline;
            isOnline = currentlyOnline;
            
            if (isOnline) {
                console.log(`[${timestamp}] Connection ${statusChanged ? 'restored' : 'active'}. Reachable: ${onlineHosts.join(', ')}`);
                if (statusChanged && !isFirstCheck) {
                    notify('Network Monitor', 'Connection restored! You are back online.', 'Info');
                }
            } else {
                console.log(`[${timestamp}] Connection ${statusChanged ? 'lost' : 'inactive'}. No hosts reachable.`);
                if (statusChanged && !isFirstCheck) {
                    notify('Network Monitor', 'Connection lost! Checking your connection...', 'Warning');
                }
            }
            isFirstCheck = false;
        } else if (!currentlyOnline) {
            console.log(`[${timestamp}] Still offline...`);
        }
    } catch (error) {
        console.error(`Check Error: ${error.message}`);
    }
}

console.log(`Network monitoring started. Checking ${HOSTS_TO_CHECK.length} hosts every ${CHECK_INTERVAL / 1000}s...`);

/**
 * Main loop
 */
async function startMonitoring() {
    await checkConnection();
    setTimeout(startMonitoring, CHECK_INTERVAL);
}

startMonitoring();
