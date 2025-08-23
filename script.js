class Timer {
    constructor() {
        this.startDate = null;
        this.isInitialized = false;
        this.lastSecond = -1;
        this.initTimer();
    }

    async initTimer() {
        try {
            // Сначала пытаемся получить время с сервера
            const serverTime = await this.getServerStartTime();
            if (serverTime) {
                this.startDate = new Date(serverTime);
                this.isInitialized = true;
            } else {
                // Если сервер недоступен, используем локальное время
                this.startDate = this.getLocalStartDate();
                this.isInitialized = true;
            }
        } catch (error) {
            console.log('Используем локальное время:', error);
            this.startDate = this.getLocalStartDate();
            this.isInitialized = true;
        }

        if (this.isInitialized) {
            this.createClockMarkings();
            // Обновляем таймер и стрелки каждые 16ms (60 FPS) для плавности
            setInterval(() => this.updateTimerSmooth(), 16);
        }
    }

    async getServerStartTime() {
        try {
            const response = await fetch('/.netlify/functions/getStartTime');
            if (response.ok) {
                const data = await response.json();
                return data.startTime;
            }
        } catch (error) {
            console.log('Ошибка получения времени с сервера:', error);
        }
        return null;
    }

    getLocalStartDate() {
        // Проверяем, есть ли сохраненная дата
        const savedDate = localStorage.getItem('timerStartDate');
        if (savedDate) {
            return new Date(parseInt(savedDate));
        } else {
            // Если нет сохраненной даты, используем текущий момент
            const now = new Date();
            localStorage.setItem('timerStartDate', now.getTime().toString());
            // Сохраняем на сервер
            this.saveServerStartTime(now.toISOString());
            return now;
        }
    }

    async saveServerStartTime(startTime) {
        try {
            await fetch('/.netlify/functions/setStartTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ startTime })
            });
        } catch (error) {
            console.log('Ошибка сохранения времени на сервер:', error);
        }
    }

    updateTimerSmooth() {
        const now = new Date();
        const diff = now - this.startDate;
        
        // Вычисляем компоненты времени с миллисекундами для плавности
        const totalSeconds = diff / 1000;
        const totalMinutes = totalSeconds / 60;
        const totalHours = totalMinutes / 60;
        const totalDays = totalHours / 24;
        const totalMonths = totalDays / 30.44;
        const totalYears = totalDays / 365.25;

        // Целочисленные значения для цифрового таймера
        const years = Math.floor(totalYears);
        const months = Math.floor(totalMonths) % 12;
        const days = Math.floor(totalDays) % 30;
        const hours = Math.floor(totalHours) % 24;
        const minutes = Math.floor(totalMinutes) % 60;
        const seconds = Math.floor(totalSeconds) % 60;

        // Обновляем цифровой таймер каждую секунду
        if (Math.floor(totalSeconds) !== this.lastSecond) {
            this.updateDigitalTimer(years, months, days, hours, minutes, seconds);
            this.lastSecond = Math.floor(totalSeconds);
        }
        
        // Обновляем аналоговые часы плавно
        this.updateAnalogClockSmooth(now, totalSeconds, totalMinutes, totalHours, totalDays, totalMonths, totalYears);
    }

    updateDigitalTimer(years, months, days, hours, minutes, seconds) {
        document.getElementById('years').textContent = years.toString().padStart(2, '0');
        document.getElementById('months').textContent = months.toString().padStart(2, '0');
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }

    createClockMarkings() {
        // Создаем разметку для секунд (60 делений)
        this.createMarkings('seconds-markings', 60, 140, 1, 'rgba(255, 255, 255, 0.3)');
        
        // Создаем разметку для минут (60 делений)
        this.createMarkings('minutes-markings', 60, 130, 1, 'rgba(255, 255, 255, 0.4)');
        
        // Создаем разметку для часов (12 делений)
        this.createMarkings('hours-markings', 12, 120, 2, 'rgba(255, 255, 255, 0.5)');
        
        // Создаем разметку для дней (10 делений) - ближе к центру
        this.createMarkings('days-markings', 10, 80, 2, 'rgba(255, 255, 255, 0.6)');
        
        // Создаем разметку для месяцев (12 делений) - ближе к центру
        this.createMarkings('months-markings', 12, 70, 2, 'rgba(255, 255, 255, 0.7)');
        
        // Создаем разметку для лет (10 делений) - ближе к центру
        this.createMarkings('years-markings', 10, 60, 2, 'rgba(255, 255, 255, 0.8)');
    }

    createMarkings(className, count, radius, width, color) {
        const container = document.querySelector(`.${className}`);
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const marking = document.createElement('div');
            marking.style.position = 'absolute';
            marking.style.width = `${width}px`;
            marking.style.height = '4px';
            marking.style.background = color;
            marking.style.left = '50%';
            marking.style.top = '50%';
            marking.style.transformOrigin = '0 0';
            marking.style.transform = `translateX(-50%) translateY(-50%) rotate(${(i * 360 / count)}deg) translateY(-${radius}px)`;
            
            container.appendChild(marking);


        }
    }



    updateAnalogClockSmooth(now, totalSeconds, totalMinutes, totalHours, totalDays, totalMonths, totalYears) {
        // Секунды: плавное движение с миллисекундами
        const secondsDegrees = (totalSeconds % 60) * 6;
        document.getElementById('seconds-hand').style.transform = 
            `translateX(-50%) rotate(${secondsDegrees}deg)`;

        // Минуты: плавное движение с секундами
        const minutesDegrees = (totalMinutes % 60) * 6;
        document.getElementById('minutes-hand').style.transform = 
            `translateX(-50%) rotate(${minutesDegrees}deg)`;

        // Часы: плавное движение с минутами
        const hoursDegrees = (totalHours % 12) * 30;
        document.getElementById('hours-hand').style.transform = 
            `translateX(-50%) rotate(${hoursDegrees}deg)`;

        // Дни: плавное движение (1-10)
        const daysInCycle = (totalDays % 10);
        const daysDegrees = daysInCycle * 36;
        document.getElementById('days-hand').style.transform = 
            `translateX(-50%) rotate(${daysDegrees}deg)`;

        // Месяцы: плавное движение (1-12)
        const monthsInCycle = (totalMonths % 12);
        const monthsDegrees = monthsInCycle * 30;
        document.getElementById('months-hand').style.transform = 
            `translateX(-50%) rotate(${monthsDegrees}deg)`;

        // Годы: плавное движение (1-10)
        const yearsInCycle = (totalYears % 10);
        const yearsDegrees = yearsInCycle * 36;
        document.getElementById('years-hand').style.transform = 
            `translateX(-50%) rotate(${yearsDegrees}deg)`;
    }
}

// Запускаем таймер при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
}); 