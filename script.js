function checkUrl() {
    const url = document.getElementById('videoUrl').value;
    const format = document.getElementById('format').value;
    const resultDiv = document.getElementById('result');
    
    if (!url) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter a valid URL</p>';
        return;
    }

    // Make API call to backend
    fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
        } else {
            displayDownloadOptions(data.formats);
        }
    })
    .catch(error => {
        resultDiv.innerHTML = '<p style="color: red;">Error processing request</p>';
    });
}

function displayDownloadOptions(formats) {
    const resultDiv = document.getElementById('result');
    let html = '<div class="download-options">';
    
    formats.forEach(format => {
        if (format.height <= 360) {
            html += `<a href="${format.url}" class="download-button">Download ${format.height}p</a>`;
        } else {
            html += `<button onclick="showPremiumPrompt()" class="premium-button">Download ${format.height}p (Premium)</button>`;
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
