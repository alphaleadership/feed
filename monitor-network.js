const dns = require('dns');
const { exec } = require('child_process');

// Configuration
const CHECK_INTERVAL = 1000; // Check every 5 seconds
const HOST_TO_CHECK = 'google.com';

let isOnline = true;

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
 * Checks connectivity by attempting to resolve a host
 */
function checkConnection() {
    dns.lookup(HOST_TO_CHECK, (err) => {
        console.log(`Checking connectivity to '${HOST_TO_CHECK}'...`);
        const currentlyOnline = !err;

        if (currentlyOnline !== isOnline) {
            isOnline = currentlyOnline;
            const timestamp = new Date().toLocaleTimeString();
            
            if (isOnline) {
                console.log(`[${timestamp}] Connection restored.`);
                notify('Network Monitor', 'Connection restored! You are back online.', 'Info');
            } else {
                console.log(`[${timestamp}] Connection lost.`);
                notify('Network Monitor', 'Connection lost! Checking your connection...', 'Warning');
            }
        }
    });
}

console.log(`Network monitoring started. Checking '${HOST_TO_CHECK}' every ${CHECK_INTERVAL / 1000}s...`);
// Initial check
checkConnection();
// Interval check
setInterval(checkConnection, CHECK_INTERVAL);
