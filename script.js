const platformContent = {
    youtube: ['Video', 'Short', 'Live'],
    instagram: ['Post', 'Story', 'Reel', 'Live'],
    facebook: ['Video', 'Story', 'Reel'],
    threads: ['Post', 'Video']
};

class VideoDownloader {
    static API_URL = 'YOUR_NETLIFY_URL/.netlify/functions';
    static token = localStorage.getItem('authToken');

    static async validateUrl(url) {
        const response = await fetch(`${this.API_URL}/api/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        return response.json();
    }

    static async downloadContent(url, platform, contentType) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.API_URL}/api/download`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ url, platform, contentType })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Download failed');
        }

        return response.json();
    }
}

let authToken = localStorage.getItem('authToken');

function setPlatform(platform) {
    // Update select element
    document.getElementById('platform').value = platform;
    
    // Update buttons
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick="setPlatform('${platform}')"]`).classList.add('active');
    
    // Update placeholder
    const urlInput = document.getElementById('videoUrl');
    urlInput.placeholder = `Paste ${platform} URL here...`;
    
    // Scroll to input and focus
    const container = document.querySelector('.container');
    container.scrollIntoView({ behavior: 'smooth' });
    urlInput.focus();
}

function updatePlaceholder() {
    const platform = document.getElementById('platform').value;
    const contentTypeSelect = document.getElementById('contentType');
    const urlInput = document.getElementById('videoUrl');
    
    contentTypeSelect.innerHTML = '<option value="">Select Content Type</option>';
    
    // Only update content types if platform is selected
    if (platform && platformContent[platform]) {
        platformContent[platform].forEach(type => {
            const value = type.toLowerCase();
            contentTypeSelect.innerHTML += `
                <option value="${value}">${type}</option>
            `;
        });
        contentTypeSelect.disabled = false;
    } else {
        contentTypeSelect.disabled = true;
    }
    
    urlInput.placeholder = platform ? 
        `Paste ${platform} URL here...` : 
        'Select platform first...';
        
    // Update buttons
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (platform) {
        document.querySelector(`button[onclick="setPlatform('${platform}')"]`).classList.add('active');
    }
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            closeLoginModal();
            checkUrl(); // Retry download
        }
    })
    .catch(err => alert('Login failed'));
}

async function checkUrl() {
    const url = document.getElementById('videoUrl').value;
    const resultDiv = document.getElementById('result');
    const downloadBtn = document.querySelector('button[onclick="checkUrl()"]');

    try {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Processing...';
        resultDiv.innerHTML = '<p>Loading... Please wait</p>';

        // Validate URL first
        const { platform, valid } = await VideoDownloader.validateUrl(url);
        if (!valid) {
            throw new Error('Invalid URL. Please check and try again.');
        }

        // Auto-select platform if not already selected
        const platformSelect = document.getElementById('platform');
        if (!platformSelect.value) {
            platformSelect.value = platform;
            updatePlaceholder();
        }

        const contentType = document.getElementById('contentType').value;
        if (!contentType) {
            throw new Error('Please select content type');
        }

        const data = await VideoDownloader.downloadContent(url, platform, contentType);
        displayDownloadOptions(data);

    } catch (error) {
        resultDiv.innerHTML = `
            <p style="color: red;">
                ${error.message}<br>
                <small>Try logging in for better quality options</small>
            </p>`;
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download';
    }
}

function displayDownloadOptions(data) {
    const resultDiv = document.getElementById('result');
    const { formats, title, thumbnail, duration } = data;
    
    let html = `
        <div class="download-info">
            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" width="200">` : ''}
            <h3>${title || 'Video'}</h3>
            ${duration ? `<p>Duration: ${Math.floor(duration/60)}:${duration%60}</p>` : ''}
        </div>
        <div class="download-options">
    `;
    
    formats.sort((a, b) => (b.height || 0) - (a.height || 0));
    
    formats.forEach(format => {
        const quality = format.height ? `${format.height}p` : 'Audio Only';
        const filesize = format.filesize ? ` (${(format.filesize/1024/1024).toFixed(1)} MB)` : '';
        
        if (!format.requiresPremium) {
            // Free quality or admin access
            html += `
                <a href="${format.url}" class="download-button" 
                   onclick="showDonationPopup()" 
                   download="${title || 'video'}.${format.format}">
                    Download ${quality}${filesize}
                </a>`;
        } else {
            // Premium required
            html += `
                <button onclick="showPremiumPrompt()" class="premium-button">
                    Get Premium for ${quality}${filesize}
                </button>`;
        }
    });
    
    html += '</div>';
    resultDiv.innerHTML = html;
}

function showDonationPopup() {
    setTimeout(() => {
        const donationHTML = `
            <div class="donation-popup" id="donationPopup">
                <div class="donation-content">
                    <h3>Support Free Downloads! 🙏</h3>
                    <p>Help us keep this service free and ad-free</p>
                    
                    <div class="donation-options">
                        <button onclick="closeDonationPopup()">Continue Free</button>
                        <button onclick="window.open('https://buymeacoffee.com/yourlink')">Buy Me a Coffee ☕</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', donationHTML);
    }, 1000);
}

function setCustomAmount(amount) {
    document.getElementById('customAmount').value = amount;
}

function showUPIDetails() {
    const amount = document.getElementById('customAmount').value || 0;
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    document.getElementById('upiDetails').style.display = 'block';
}

function closeDonationPopup() {
    const popup = document.getElementById('donationPopup');
    if (popup) {
        popup.remove();
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showPricingModal() {
    const currency = document.getElementById('currency').value;
    const prices = {
        USD: {
            month: .22,
            quarter: .56,
            year: 2.29
        },
        INR: {
            month: 19,
            quarter: 49,
            year: 199
        }
    };
    
    const symbol = currency === 'USD' ? '$' : '₹';
    const p = prices[currency];
    
    alert(`Premium Plans:\n1 Month: ${symbol}${p.month}\n3 Months: ${symbol}${p.quarter}\n1 Year: ${symbol}${p.year}`);
}

function showPremiumPrompt() {
    const premiumHTML = `
        <div class="premium-popup" id="premiumPopup">
            <div class="premium-content">
                <h3>Premium Access Required</h3>
                <p>Download videos in HD quality (720p/1080p)</p>
                
                <div class="premium-plans">
                    <div class="plan">
                        <h4>Monthly</h4>
                        <p class="price">₹19/month</p>
                        <button onclick="redirectToAuth()">Get Premium</button>
                    </div>
                    <div class="plan">
                        <h4>Yearly</h4>
                        <p class="price">₹199/year</p>
                        <p class="savings">Save 12%</p>
                        <button onclick="redirectToAuth()">Get Premium</button>
                    </div>
                </div>
                
                <button onclick="closePremiumPopup()" class="close-button">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', premiumHTML);
}

function redirectToAuth() {
    window.location.href = 'auth.html?premium=true';
}

function selectPlatform(platform) {
    const platformSelect = document.getElementById('platform');
    platformSelect.value = platform;
    updatePlaceholder();
    // Scroll to the input section
    document.querySelector('.input-container').scrollIntoView({ behavior: 'smooth' });
}

function downloadVideo() {
    const url = document.getElementById('videoUrl').value;
    const quality = document.getElementById('quality').value;
    const result = document.getElementById('result');
    
    if (!url) {
        result.innerHTML = '<p style="color: red;">Please enter a URL</p>';
        return;
    }

    // Basic URL validation
    if (!url.includes('youtube.com') && 
        !url.includes('youtu.be') && 
        !url.includes('instagram.com') && 
        !url.includes('facebook.com')) {
        result.innerHTML = '<p style="color: red;">Please enter a valid YouTube, Instagram or Facebook URL</p>';
        return;
    }

    result.innerHTML = '<p style="color: green;">Processing your request...</p>';
    
    // Simulate download process
    setTimeout(() => {
        result.innerHTML = `
            <div class="download-success">
                <h3>Download Started!</h3>
                <p>Your download will begin shortly...</p>
            </div>
        `;
        showDonationPopup();
    }, 2000);
}
