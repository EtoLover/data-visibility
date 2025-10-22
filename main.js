// 注意：为了在浏览器中读取本地CSV文件，您需要一个支持AJAX请求的环境，
// 或者使用特定的库（如 d3.csv 或 Papa Parse）。这里我们使用原生的 Fetch API，
// 它在 GitHub Pages (托管) 和现代浏览器中都工作良好。

/**
 * 辅助函数：读取CSV文件
 * @param {string} url - CSV文件的路径
 * @returns {Promise<Array<Object>>} - 解析后的数据数组
 */
function fetchCsvData(url) {
    // 假设数据是以逗号分隔，且第一行是标题
    return fetch(url)
        .then(response => response.text())
        .then(text => {
            const lines = text.trim().split('\n');
            // 假设 summary.csv 的标题在第三行 (index 2)
            let headerLineIndex = url.includes('summary.csv') ? 2 : 0;
            
            const headers = lines[headerLineIndex].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = [];
            
            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    data.push(row);
                }
            }
            return data;
        });
}


// --- 1. 地图：按国家分布的公司数量 (使用 world_500.csv) ---
function drawMapChart() {
    fetchCsvData('data/world_500.csv').then(data => {
        // 1. 数据处理：统计每个国家的公司数量
        const countryCounts = data.reduce((acc, row) => {
            const country = row['国家'];
            if (country) {
                acc[country] = (acc[country] || 0) + 1;
            }
            return acc;
        }, {});

        // 2. 转换为 ECharts 地图格式 (需要将中文国家名映射到英文/地图库识别的名称)
        // 这是一个简化版映射。实际应用中，'中国' 应该映射到 'China'
        const mapData = Object.entries(countryCounts).map(([country, count]) => {
            // 注意：ECharts world.js 文件使用的是英文国家名。
            // 这里提供一个简单的中文到英文的映射：
            let mapName = country;
            if (country.includes('中国')) mapName = 'China';
            else if (country.includes('美国')) mapName = 'United States';
            else if (country.includes('日本')) mapName = 'Japan';
            // ... 更多映射 ...

            return { name: mapName, value: count };
        });

        const chartDom = document.getElementById('mapChart');
        const myChart = echarts.init(chartDom);
        
        const option = {
            title: {
                text: '世界五百强企业国家分布',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{b}<br/>公司数量: {c}'
            },
            visualMap: {
                min: 0,
                max: 150, // 假设最多150家
                text: ['高', '低'],
                realtime: false,
                calculable: true,
                inRange: {
                    color: ['lightskyblue', 'yellow', 'orangered']
                }
            },
            series: [
                {
                    name: '公司数量',
                    type: 'map',
                    map: 'world',
                    roam: true, // 允许缩放和平移
                    data: mapData,
                    nameMap: { // 确保地图上的国家名显示中文 (可选)
                        'China': '中国',
                        'United States': '美国',
                        // ...
                    },
                    emphasis: {
                        label: {
                            show: true
                        }
                    }
                }
            ]
        };

        myChart.setOption(option);
    });
}


// --- 2. 柱状图：不同行业的平均利润率 (使用 summary.csv) ---
function drawBarChart() {
    fetchCsvData('data/summary.csv').then(data => {
        // 1. 数据处理：提取行业名称和平均利润率
        // 假设 summary.csv 的列为: 行业(个人观点),平均利润率,公司数量
        const industries = data.map(row => row['行业(个人观点)']);
        // 利润率是字符串，需要转为数字，并按百分比格式化
        const avgProfitRates = data.map(row => (parseFloat(row['平均利润率']) * 100).toFixed(2)); 

        const chartDom = document.getElementById('barChart');
        const myChart = echarts.init(chartDom);

        const option = {
            title: {
                text: '各行业平均利润率（个人观点分类）',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: '{b}: {c}%'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: '平均利润率 (%)',
                axisLabel: {
                    formatter: '{value}%'
                }
            },
            yAxis: {
                type: 'category',
                data: industries,
                axisLabel: {
                    interval: 0 // 确保所有标签显示
                }
            },
            series: [
                {
                    name: '平均利润率',
                    type: 'bar',
                    data: avgProfitRates,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#2952A3' },
                            { offset: 1, color: '#3398DB' }
                        ])
                    }
                }
            ]
        };

        myChart.setOption(option);
    });
}


// --- 3. 饼图和折线图的绘制函数 (请根据类似逻辑自行补充) ---
// function drawPieChart() { ... }
// function drawLineChart() { ... }


// --- 启动所有图表绘制 ---
window.onload = function() {
    drawMapChart();
    drawBarChart();
    // drawPieChart(); // 待补充
    // drawLineChart(); // 待补充
    
    // 监听窗口大小变化，使图表自适应
    window.addEventListener('resize', () => {
        echarts.getInstanceByDom(document.getElementById('mapChart'))?.resize();
        echarts.getInstanceByDom(document.getElementById('barChart'))?.resize();
        // ... 其他图表
    });
};
