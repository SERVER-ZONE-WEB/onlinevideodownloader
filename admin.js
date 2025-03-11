const ADMIN_PASSWORD = 'admin123'; // Change this to a secure password

const platformContent = {
    youtube: ['Video', 'Short', 'Playlist'],
    instagram: ['Post', 'Story', 'Reel', 'IGTV'],
    facebook: ['Video', 'Story', 'Reel'],
    threads: ['Post', 'Video']
};

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('downloadSection').style.display = 'block';
        sessionStorage.setItem('adminLoggedIn', 'true');
    } else {
        alert('Invalid password');
    }
}

function adminDownload() {
    const platform = document.getElementById('platform').value;
    const contentType = document.getElementById('contentType').value;
    const url = document.getElementById('videoUrl').value;
    const resultDiv = document.getElementById('result');

    if (!url) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter URL</p>';
        return;
    }

    resultDiv.innerHTML = '<p>Loading... Please wait</p>';

    fetch('/api/admin/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Admin-Auth': ADMIN_PASSWORD
        },
        body: JSON.stringify({ url, platform, contentType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        displayAdminDownloadOptions(data.formats);
    })
    .catch(error => {
        resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    });
}

function displayAdminDownloadOptions(formats) {
    const resultDiv = document.getElementById('result');
    let html = '<div class="download-options">';
    
    formats.sort((a, b) => (b.height || 0) - (a.height || 0));
    
    formats.forEach(format => {
        const quality = format.height ? `${format.height}p` : 'Audio Only';
        const filesize = format.filesize ? ` (${(format.filesize/1024/1024).toFixed(1)} MB)` : '';
        
        html += `
            <a href="${format.url}" class="download-button" download>
                Download ${quality}${filesize}
            </a>`;
    });
    
    html += '</div>';
    resultDiv.innerHTML = html;
}

// Initialize platform content types
function updatePlaceholder() {
    const platform = document.getElementById('platform').value;
    const contentTypeSelect = document.getElementById('contentType');
    
    contentTypeSelect.innerHTML = '<option value="">Select Content Type</option>';
    if (platform && platformContent[platform]) {
        platformContent[platform].forEach(type => {
            contentTypeSelect.innerHTML += `<option value="${type.toLowerCase()}">${type}</option>`;
        });
    }
}
