// script.js
function get_elements(){
	colors=['#9BE9A8','#3FC463','#31A14E','#216E39']
	// 获取 DOM 元素
	p= document.querySelector('body');//前面什么都没加const var的为全局变量
	footer=document.querySelector('body footer')
	together=document.createElement('div');
	together.classList.add('together');
	if(footer)p.insertBefore(together, footer);
	else p.appendChild(together);
	console.log(together);

	inline=document.createElement('div');
	inline.id='header';
	together.appendChild(inline);
	
	title=document.getElementsByClassName('c_title')[0];
	if (title===undefined){//==会进行类型转换 ===不会
	  title=document.createElement('span');
	  title.textContent='Contribution';
	  title.classList.add('c_title');
	  together.appendChild(title);
	}
	label=document.getElementsByClassName('c_label')[0];
	if(label===undefined){
	  label=document.createElement('label');
	  label.textContent='Select Year:';
	  label.classList.add('c_label')
	  together.appendChild(label);
	}
	yearSelect=document.getElementsByClassName('year-select')[0];
	if(yearSelect===undefined){
	  yearSelect = document.createElement('select');
	  yearSelect.classList.add('year-select');
	  together.appendChild(yearSelect);
	}
	cpright=document.getElementsByClassName('cpright')[0];
	if (cpright===undefined){//==会进行类型转换 ===不会
	  cpright=document.createElement('span');
	  cpright.textContent='by Yoyo';
	  cpright.classList.add('cpright');
	  together.appendChild(cpright);
	}
	inline.appendChild(title);
	inline.appendChild(label);
	inline.appendChild(yearSelect);
	inline.appendChild(cpright);

	month_float=document.getElementsByClassName('month_float')[0];
	if(month_float===undefined){
		month_float = document.createElement('div');
		month_float.classList.add('month_float');
		together.appendChild(month_float);//添加一个新的类名
	}

	calendarElement=document.getElementsByClassName('calendar')[0];
	if(calendarElement===undefined){
	  calendarElement = document.createElement('div');
	  calendarElement.classList.add('calendar');
	  together.appendChild(calendarElement);
	}

	lessmore=document.getElementsByClassName('lessmore')[0];
	if(lessmore===undefined){
	  lessmore = document.createElement('p');
	  lessmore.classList.add('lessmore');
	  together.appendChild(lessmore);
	  lessmore.innerHTML="less<div id='desc_blocks'></div>more";
	  desc_blocks=document.getElementById('desc_blocks');
	  for(let i=0;i<4;i++){
		let item=document.createElement('div');
		item.classList.add('desc_blocks_item');
		item.style.backgroundColor=colors[i];
		desc_blocks.appendChild(item);
	  }
	}

	fireworks=document.getElementsByClassName('fireworks')[0];
	if(fireworks===undefined){
	  fireworks = document.createElement('div');
	  fireworks.classList.add('fireworks');
	  together.appendChild(fireworks);
	}
	
  }
  
  // 渲染年份选择器
  function renderYearSelect(currentYear) {
	for (let i = currentYear - 5; i <= currentYear; i++) {
	  const option = document.createElement('option');
	  option.value = i;
	  option.text = i;
	  yearSelect.appendChild(option);
	}
	yearSelect.value = currentYear; // 默认选中当前年份
  }
  
  // 获取某个年份每个月的天数
  function getDaysInMonth(month, year) {
	const date = new Date(year, month + 1, 0);/*当月最后一天 */
	//console.log(date.getDate());/*返回最后一天的日号 */
	return date.getDate();
  }
  function padStart2_0(num){
	return String(num).padStart(2,'0');
  }
    // 生成随机颜色
function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

  // 渲染打卡墙
  function renderCalendar(year=currentYear) {
	
	  const daytip = document.createElement('div');
	  daytip.classList.add('tooltip');
	  together.appendChild(daytip);
	  calendarElement.innerHTML = ''; // 清空之前的内容
	  month_text=['Jan','↓','Dec']
	  for (let month = 0; month < 12; month++) {
		const monthContainer = document.createElement('div');
		monthContainer.classList.add('month-container');//添加一个新的类名
		 if(month_float.children.length<3){
			// 添加月份头部
			const monthHeader = document.createElement('div');
			monthHeader.classList.add('month-header');
			monthHeader.textContent = month_text[month];
			month_float.appendChild(monthHeader);
		 }
		  
		  // 渲染每个月的打卡格子
		  const daysInMonth = getDaysInMonth(month, year);
		  for (let day = 1; day <= daysInMonth; day++) {
			  const dayElement = document.createElement('div');
			  // 检查是否已打卡
			  let thisday=`${year}-${padStart2_0(month+1)}-${padStart2_0(day)}`;
			  dayElement.classList.add('grid-item');
			  //dayElement.textContent = day;
			  dayElement.setAttribute('block_date',`${thisday} : ${checkedDays[thisday]?? 'no'} ${checkedDays[thisday]===1?'post':'posts'}`);
			  monthContainer.appendChild(dayElement);
  
			  if (thisday in checkedDays) {
				  dayElement.classList.add('checked');
				  switch (checkedDays[thisday]){
					case 1:
						dayElement.style.backgroundColor=colors[0];
						break;
					case 2:
						dayElement.style.backgroundColor=colors[1];
						break;
					case 3:
						dayElement.style.backgroundColor=colors[2];
						break;
					default:
						dayElement.style.backgroundColor=colors[3];
				  }
			  } else {
				  dayElement.classList.add('unchecked');
			  }
  
			  // 点击格子打卡
			  dayElement.addEventListener('click', (event) => {
				const rect = event.target.getBoundingClientRect();
				
				let numParticles = 10; // 粒子的数量
				container=document.getElementsByClassName('fireworks')[0];
				for (let i = 0; i < numParticles; i++) {
					let firework = document.createElement('div');
					firework.classList.add('firework');
			
					// 随机设置颜色
					let color = getRandomColor();
					firework.style.backgroundColor = color;
					firework.style.position = 'absolute';
					const centerX=`${rect.left + scrollX}`;
					const centerY=`${rect.top+ scrollY-10}`; //rect.top+ scrollY才是元素的绝对位置 相对于整个网页的坐标
					console.log(rect.top,centerY)
					// 设置烟花的初始位置为点击位置
					container.style.left = centerX+'px';
					container.style.top =centerY+'px';
					firework.style.left = `0px`;
					firework.style.top =  `0vh`;
					firework.style.width = '0.3vw';
					firework.style.height = '0.3vw';
					let factor=0.5
					if(innerWidth<700){
						firework.style.width = '1vw';
						firework.style.height = '1vw';
						factor=1
					}
					
					firework.style.zIndex='10';
					firework.style.display='block';
					console.log(Math.PI/180)
					const angle=(Math.PI/180)*(i+1)*(360/10);
					// 计算目标点的坐标
					const x = Math.cos(angle) * factor;
					const y = Math.sin(angle) * factor;
					console.log(angle,x,y,centerX,centerY);
					 // 使用 transform 来计算并设置粒子的位置
					firework.style.transform = `translate(${x}vw, ${y}vw)`;
					// 设置烟花的飞行方向
					// firework.style.animationName = 'explode';
					// firework.style.animationTimingFunction = 'ease-out';
					//console.log(firework)
					
					container.appendChild(firework);
					console.log(firework.style.transform);
					// 或者使用这种方法触发样式更新
					container.style.display = 'none';
					container.offsetHeight;  // 强制浏览器重绘
					container.style.display = 'block';
					//清理：动画结束后移除烟花元素
					// firework.addEventListener('animationend', function() {
					// 	firework.remove();
					// });
				}
			  });
		  }
		  
		  calendarElement.appendChild(monthContainer);
	}
	//console.log(month_float);
	func_tooltip();
  }
  
  // 获取本地存储的打卡日期
  // function getCheckedDays() {
  //   const checkedDays = JSON.parse(localStorage.getItem('checkedDays')) || [];
  //   func_tooltip();
  //   return checkedDays;
  // }
  
  // // 更新本地存储中的打卡日期
  // function updateCheckedDays(checkedDays) {
  //   console.log(hexo.locals.get("posts"));
  //   localStorage.setItem('checkedDays', JSON.stringify(checkedDays));
  // }
  
  // 取消切换打卡状态
  //烟花
  //function toggleCheckIn(year, month, day) {
    // const checkedDays = getCheckedDays();
    // const dayString = `${year}-${month}-${day}`;
  
    // // 如果已打卡，则移除
    // if (checkedDays.includes(dayString)) {
    //   const index = checkedDays.indexOf(dayString);
    //   checkedDays.splice(index, 1);
    // } else {
    //   // 否则，添加打卡
    //   checkedDays.push(dayString);
    // }
  
    // updateCheckedDays(checkedDays);
    // renderCalendar(year);  // 重新渲染
	
  //}
  
  function func_tooltip(){
	  // 获取所有的日期块
	const dateBlocks = document.querySelectorAll('.grid-item');
	dateBlocks.forEach(block =>{
		block.addEventListener('mouseenter', (e) => {
		// 获取data-date属性的值
		const date = e.target.getAttribute('block_date');
		daytip=document.getElementsByClassName('tooltip')[0];
		daytip.textContent=date;
		// 获取日期块的位置，定位 tooltip
		const rect = e.target.getBoundingClientRect();
		//console.log(date,daytip,rect);
		daytip.style.position='absolute';
		//console.log(block,scrollX);
		daytip.style.left=`${rect.left + scrollX-30}px`;
		daytip.style.top=`${rect.top+scrollY -60}px`;
		daytip.style.display='block';
		
		})
		// 当鼠标离开时隐藏 tooltip
	  block.addEventListener('mouseleave', () => {
		daytip.style.display = 'none';
	  });
	});
  }

  function all(){
	//这里插入checkedDays变量
	checkedDays = {"2015-10-26":1,"2016-10-08":1,"2020-11-14":1,"2018-04-28":1,"2018-02-26":1,"2018-01-07":1,"2025-02-03":1,"2017-09-26":1,"2016-07-07":1,"2019-03-25":1,"2019-03-21":1,"2018-02-16":1,"2025-02-02":1,"2016-03-06":1,"2023-10-03":1,"2017-10-09":1,"2023-11-15":1,"2021-11-09":1,"2025-04-14":2,"2025-10-21":1,"2025-10-13":1,"2025-01-26":1,"2025-08-05":2,"2025-08-11":2,"2024-02-05":2,"2024-09-12":1,"2024-11-18":3,"2024-12-29":1,"2024-12-26":2,"2025-08-20":1,"2025-05-25":1,"2025-03-23":1,"2024-11-22":1,"2025-03-25":1,"2025-04-23":1,"2025-02-11":2,"2025-06-02":2,"2025-10-18":1,"2025-07-10":3,"2024-11-20":1,"2025-04-29":1,"2025-03-24":1,"2025-09-17":1,"2024-12-30":1,"2024-11-21":1,"2024-12-24":1,"2024-09-11":1,"2025-03-03":2,"2024-12-03":1,"2025-09-19":1,"2025-05-12":2,"2025-03-17":1,"2025-06-20":2,"2025-10-03":1,"2025-02-27":3,"2025-01-23":2,"2025-04-21":1,"2025-09-02":1,"2025-08-12":3,"2024-10-24":1,"2024-03-07":1,"2025-02-05":1,"2025-10-28":1,"2025-10-05":1,"2025-09-24":2,"2025-07-21":2,"2025-02-20":1,"2025-01-13":3,"2025-01-22":1,"2025-09-18":1,"2025-10-22":1,"2025-01-19":1,"2024-12-02":1,"2025-04-10":1,"2025-04-17":1,"2024-11-13":1,"2024-11-25":1,"2025-03-19":2,"2025-09-22":1,"2025-02-10":1,"2024-11-17":1,"2024-04-14":1,"2025-03-12":1,"2025-10-11":1,"2025-10-14":1,"2025-03-27":1,"2024-09-29":1,"2024-11-12":1,"2025-11-06":1,"2025-02-12":1,"2024-12-01":1,"2025-02-25":1,"2025-03-26":1,"2025-07-24":1,"2025-08-07":1,"2025-11-09":1,"2024-10-23":1,"2024-12-25":1,"2025-08-04":1,"2024-11-11":1,"2024-09-17":1,"2025-02-18":1,"2025-03-31":1,"2024-11-23":1,"2024-04-27":1,"2025-02-16":1,"2025-07-30":1,"2025-07-31":1,"2024-12-11":1,"2025-07-06":1,"2025-03-04":1,"2025-04-06":1,"2025-11-11":1,"2024-11-26":1};
	currentYear=new Date().getFullYear();
	//默认今年
	get_elements();
	// 初始化年份选择器和打卡墙
	renderYearSelect(currentYear);
	// 监听年份选择变化
	yearSelect.addEventListener('change', (event) => {
	  const selectedYear = event.target.value;
	  console.log(event)
	  renderCalendar(selectedYear);  // 根据选择的年份渲染打卡墙
	});
	renderCalendar();
  }
  
  document.addEventListener('DOMContentLoaded', function() {
	// DOM 渲染完成后执行的代码
	console.log('DOM已完全加载，可以执行 JS 文件');
	let link=document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = './style.css';  // CSS 文件的路径
	// 将 <link> 标签添加到 <head> 中
	document.head.appendChild(link);
	all();
  });

