const platformContent = {
    youtube: ['Video', 'Short', 'Playlist'],
    instagram: ['Post', 'Story', 'Reel', 'IGTV'],
    facebook: ['Video', 'Story', 'Reel'],
    threads: ['Post', 'Video']
};

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
}

function checkUrl() {
    const platform = document.getElementById('platform').value;
    const contentType = document.getElementById('contentType').value;
    const url = document.getElementById('videoUrl').value;
    const format = document.getElementById('format').value;
    const resultDiv = document.getElementById('result');
    const downloadBtn = document.querySelector('button[onclick="checkUrl()"]');
    
    // Validation
    if (!platform) {
        resultDiv.innerHTML = '<p style="color: red;">Please select a platform</p>';
        return;
    }
    if (!contentType) {
        resultDiv.innerHTML = '<p style="color: red;">Please select content type</p>';
        return;
    }
    if (!url) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter URL</p>';
        return;
    }

    // Show loading state
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    resultDiv.innerHTML = '<p>Loading... Please wait</p>';

    // Make API call
    fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            url, 
            format, 
            platform, 
            contentType,
            timestamp: Date.now() // Prevent caching
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        if (!data.formats || data.formats.length === 0) {
            throw new Error('No download options available');
        }
        displayDownloadOptions(data.formats);
    })
    .catch(error => {
        resultDiv.innerHTML = `<p style="color: red;">${error.message || 'Error processing request'}</p>`;
    })
    .finally(() => {
        // Reset button state
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download';
    });
}

function displayDownloadOptions(formats) {
    const resultDiv = document.getElementById('result');
    let html = '<div class="download-options">';
    
    // Sort formats by quality
    formats.sort((a, b) => (b.height || 0) - (a.height || 0));
    
    formats.forEach(format => {
        const quality = format.height ? `${format.height}p` : 'Audio Only';
        const filesize = format.filesize ? ` (${(format.filesize/1024/1024).toFixed(1)} MB)` : '';
        
        if (!format.height || format.height <= 360) {
            html += `
                <a href="${format.url}" class="download-button" download>
                    Download ${quality}${filesize}
                </a>`;
        } else {
            html += `
                <button onclick="showPremiumPrompt()" class="premium-button">
                    Download ${quality}${filesize} (Premium)
                </button>`;
        }
    });
    
    html += '</div>';
    resultDiv.innerHTML = html;
}

function showPricingModal() {
    const currency = document.getElementById('currency').value;
    const prices = {
        USD: {
            month: 4.99,
            quarter: 12.99,
            year: 39.99
        },
        INR: {
            month: 399,
            quarter: 999,
            year: 2999
        }
    };
    
    const symbol = currency === 'USD' ? '$' : '₹';
    const p = prices[currency];
    
    alert(`Premium Plans:\n1 Month: ${symbol}${p.month}\n3 Months: ${symbol}${p.quarter}\n1 Year: ${symbol}${p.year}`);
}

function showPremiumPrompt() {
    alert('Please upgrade to Premium to download in higher quality!');
}
