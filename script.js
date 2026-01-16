document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const fileNameDisplay = document.getElementById('fileName');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const downloadBtn = document.getElementById('downloadBtn');
    const placeholder = document.getElementById('placeholder');

    // Inputs
    const inputs = {
        subtitleHeight: document.getElementById('subtitleHeight'),
        fontSize: document.getElementById('fontSize'),
        fontColor: document.getElementById('fontColor'),
        strokeColor: document.getElementById('strokeColor'),
        strokeWidth: document.getElementById('strokeWidth'),
        lineGap: document.getElementById('lineGap'),
        subtitleText: document.getElementById('subtitleText')
    };

    // State
    let originalImage = null;
    let imageLoaded = false;

    // Event Listeners
    imageInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadImage);

    // Add listeners to all inputs for real-time update
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', () => {
            // Update color value displays
            if (input.type === 'color') {
                input.nextElementSibling.textContent = input.value;
            }
            if (imageLoaded) {
                render();
            }
        });
    });

    // Handle Image Upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                imageLoaded = true;
                placeholder.style.display = 'none';
                downloadBtn.disabled = false;
                
                // Initialize subtitle height relative to image size if needed
                // For better UX, we could auto-set font size based on image width
                // inputs.fontSize.value = Math.max(16, Math.floor(img.width / 20));
                
                render();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Render Function
    function render() {
        if (!originalImage) return;

        // Get parameter values
        const params = {
            subtitleHeight: parseInt(inputs.subtitleHeight.value) || 80,
            fontSize: parseInt(inputs.fontSize.value) || 32,
            fontColor: inputs.fontColor.value,
            strokeColor: inputs.strokeColor.value,
            strokeWidth: parseInt(inputs.strokeWidth.value) || 0,
            lineGap: parseInt(inputs.lineGap.value) || 0,
            text: inputs.subtitleText.value
        };

        // Parse text into lines (filter empty lines if needed, currently keeping them)
        const lines = params.text.split('\n'); // .filter(line => line.trim() !== '');
        const lineCount = lines.length;

        // Calculate Canvas Dimensions
        // Height = Image Height + (Line Count - 1) * (Subtitle Height + Gap)
        // Note: The first line is drawn ON the original image, so it doesn't add height.
        // If there are 0 lines, we just show original image.
        
        let canvasWidth = originalImage.width;
        let canvasHeight = originalImage.height;

        if (lineCount > 1) {
            canvasHeight += (lineCount - 1) * (params.subtitleHeight + params.lineGap);
        }

        // Resize Canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // 1. Draw Original Image
        ctx.drawImage(originalImage, 0, 0);

        // Prepare background strip (from the bottom of original image)
        // We capture it from the original image to avoid capturing any text we just drew
        const bgStripCanvas = document.createElement('canvas');
        bgStripCanvas.width = canvasWidth;
        bgStripCanvas.height = params.subtitleHeight;
        const bgCtx = bgStripCanvas.getContext('2d');
        
        // Source Y: Bottom of image - subtitle height
        // We clamp it to be at least 0
        const sourceY = Math.max(0, originalImage.height - params.subtitleHeight);
        
        bgCtx.drawImage(
            originalImage, 
            0, sourceY, canvasWidth, params.subtitleHeight, // Source
            0, 0, canvasWidth, params.subtitleHeight        // Destination
        );

        // 2. Draw Extension Strips (for lines 2..n)
        if (lineCount > 1) {
            for (let i = 1; i < lineCount; i++) {
                const y = originalImage.height + (i - 1) * (params.subtitleHeight + params.lineGap) + params.lineGap;
                
                // Draw gap (optional, could be transparent or colored)
                // ctx.fillStyle = '#ffffff';
                // ctx.fillRect(0, y - params.lineGap, canvasWidth, params.lineGap);

                // Draw background strip
                ctx.drawImage(bgStripCanvas, 0, y);
            }
        }

        // 3. Draw Text
        ctx.font = `bold ${params.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = params.fontColor;
        ctx.strokeStyle = params.strokeColor;
        ctx.lineWidth = params.strokeWidth;
        ctx.lineJoin = 'round';

        lines.forEach((line, index) => {
            let centerY;
            
            if (index === 0) {
                // First line: Bottom of original image
                // Center of the subtitle area at the bottom of original image
                centerY = originalImage.height - (params.subtitleHeight / 2);
            } else {
                // Subsequent lines
                // yStart = originalImage.height + (index - 1) * (height + gap) + gap
                // centerY = yStart + height/2
                const yStart = originalImage.height + (index - 1) * (params.subtitleHeight + params.lineGap) + params.lineGap;
                centerY = yStart + (params.subtitleHeight / 2);
            }

            const centerX = canvasWidth / 2;

            if (params.strokeWidth > 0) {
                ctx.strokeText(line, centerX, centerY);
            }
            ctx.fillText(line, centerX, centerY);
        });
    }

    // Download Function
    function downloadImage() {
        if (!imageLoaded) return;
        
        const link = document.createElement('a');
        link.download = `subtitle-export-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
});
