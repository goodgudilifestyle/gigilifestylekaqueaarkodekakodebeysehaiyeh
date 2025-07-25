document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('scratchCanvas');
    const ctx = canvas.getContext('2d');
    const revealImageElem = document.getElementById('revealImage');
    const offerDisplay = document.getElementById('offerDisplay');
    const offerNameElem = document.getElementById('offerName');
    const loadingMessage = document.getElementById('loadingMessage');
    const customAlert = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertCloseButton = document.getElementById('alertCloseButton');
    const confettiContainer = document.getElementById('confetti-container');
    const mainHeading = document.getElementById('mainHeading');

    // Invoice Authentication Modal Elements (NEW)
    const invoiceAuthenticationModal = document.getElementById('invoiceAuthenticationModal');
    const invoicePromptText = document.getElementById('invoicePromptText');
    const invoiceInput = document.getElementById('invoiceInput');
    const invoiceSubmitButton = document.getElementById('invoiceSubmitButton');
    const authenticationMessage = document.getElementById('authenticationMessage'); // For loading/success text

    let isScratching = false;
    let coverImage = new Image();
    let currentOfferName = '';
    let cardScratchedOnce = false;

    const SCRATCH_PERCENTAGE_THRESHOLD = 70;
    const SCRATCH_RADIUS = 40;

    // Function for custom alerts
    function showAlert(title, message) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        customAlert.classList.remove('hidden');
        customAlert.querySelector('.transform').classList.add('scale-100');
    }

    alertCloseButton.addEventListener('click', () => {
        customAlert.querySelector('.transform').classList.remove('scale-100');
        setTimeout(() => {
            customAlert.classList.add('hidden');
        }, 300);
    });

    // Function to resize canvas and redraw images
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    // --- Confetti Animation ---
    function createConfettiPiece() {
        const piece = document.createElement('div');
        piece.classList.add('confetti');
        const colors = ['#f0f', '#0ff', '#ff0', '#f00', '#0f0', '#00f'];
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.top = `${Math.random() * 100}%`;
        piece.style.setProperty('--x', `${(Math.random() - 0.5) * 500}px`);
        piece.style.setProperty('--y', `${500 + Math.random() * 200}px`);
        piece.style.setProperty('--rot', `${Math.random() * 720}deg`);
        return piece;
    }

    function launchConfetti() {
        for (let i = 0; i < 50; i++) {
            const piece = createConfettiPiece();
            confettiContainer.appendChild(piece);
            piece.addEventListener('animationend', () => {
                piece.remove();
            });
        }
    }

    // --- Scratch Card Logic ---
    function initializeScratchCard() {
        console.log("Initializing scratch card...");
        document.getElementById('scratch-area').classList.remove('hidden'); // Show scratch area
        loadingMessage.classList.remove('hidden'); // Show loading message
        offerDisplay.classList.add('hidden');
        revealImageElem.classList.add('hidden');
        canvas.style.pointerEvents = 'none'; // Disable scratching until ready

        cardScratchedOnce = false;
        mainHeading.textContent = "Scratch to Win!"; // Reset heading text if needed after previous win

        resizeCanvas();

        let coverImageLoaded = false;
        let revealImageLoaded = false;

        const checkImagesLoadedAndEnableScratching = () => {
            if (coverImageLoaded && revealImageLoaded) {
                console.log("Both cover and reveal images loaded. Enabling scratching.");
                loadingMessage.classList.add('hidden');
                canvas.style.pointerEvents = 'auto'; // Enable scratching
            }
        };

        coverImage.src = STATIC_COVER_IMAGE_PATH;
        coverImage.onload = () => {
            console.log("Cover image loaded successfully. Drawing on canvas.");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(coverImage, 0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'destination-out';
            coverImageLoaded = true;
            checkImagesLoadedAndEnableScratching();
        };
        coverImage.onerror = () => {
            console.error("Failed to load cover image at:", STATIC_COVER_IMAGE_PATH);
            loadingMessage.textContent = "Error loading cover image.";
            showAlert("Error", "Failed to load cover image. Please check the path and try again.");
            loadingMessage.classList.add('hidden');
            canvas.style.pointerEvents = 'none';
            revealImageLoaded = true; // Still mark as loaded to proceed and hide loading message
            checkImagesLoadedAndEnableScratching();
        };

        fetchOffer();

        revealImageElem.onload = () => {
            console.log("Reveal image HTML element loaded successfully.");
            revealImageElem.style.width = '100%';
            revealImageElem.style.height = '100%';
            revealImageElem.style.objectFit = 'cover';
            revealImageLoaded = true;
            checkImagesLoadedAndEnableScratching();
        };
        revealImageElem.onerror = () => {
            console.error("Failed to load offer image at:", revealImageElem.src);
            loadingMessage.textContent = "Error loading offer image.";
            showAlert("Error", "Failed to load offer image. Please try again.");
            loadingMessage.classList.add('hidden');
            canvas.style.pointerEvents = 'none';
            revealImageLoaded = true;
            checkImagesLoadedAndEnableScratching();
        };
    }

    async function fetchOffer() {
        console.log("Fetching offer from backend...");
        try {
            const response = await fetch('/get_offer');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Offer data received:", data);

            currentOfferName = data.name;
            revealImageElem.src = STATIC_OFFERS_URL + data.image;

            if (data.message && data.message.includes("No offers left")) {
                console.log("No offers left scenario.");
                canvas.style.pointerEvents = 'none';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                revealImageElem.classList.remove('hidden');
                offerDisplay.classList.remove('hidden');
                offerNameElem.textContent = currentOfferName;
                showAlert("Out of Luck!", "Sorry, all our offers have been redeemed.");
                loadingMessage.classList.add('hidden');
                revealImageLoaded = true; // Ensure loading state resolves
                checkImagesLoadedAndEnableScratching();
            } else {
                // `revealImageElem.onload` will handle setting `revealImageLoaded` and `checkImagesLoadedAndEnableScratching`
            }

        } catch (error) {
            console.error('Error fetching offer or processing response:', error);
            loadingMessage.textContent = "Failed to load offers. Please try again.";
            showAlert("Error", `Could not fetch offers: ${error.message}. Check your connection or server status.`);
            loadingMessage.classList.add('hidden');
            canvas.style.pointerEvents = 'none';
            revealImageLoaded = true; // Ensure loading state resolves
            checkImagesLoadedAndEnableScratching();
        }
    }

    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function scratch(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    function getScratchedPercentage() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }
        return (transparentPixels / (canvas.width * canvas.height)) * 100;
    }

    function handleScratchCompletion() {
        if (!cardScratchedOnce) {
            cardScratchedOnce = true;
            canvas.style.pointerEvents = 'none';
            offerDisplay.classList.remove('hidden');
            offerNameElem.textContent = currentOfferName;
            launchConfetti();
            showAlert("You Won!", currentOfferName);
            incrementScratchCounter();
            revealImageElem.classList.remove('hidden');
            mainHeading.textContent = "YOU WON!"; // Update heading to "YOU WON!"
        }
    }

    async function incrementScratchCounter() {
        try {
            await fetch('/increment_scratch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            console.log('Scratch counter incremented.');
        } catch (error) {
            console.error('Error incrementing scratch counter:', error);
        }
    }

    // --- Invoice Authentication Logic (NEW) ---
    invoiceSubmitButton.addEventListener('click', () => {
        const invoiceNumber = invoiceInput.value.trim();

        // Client-side validation for exactly 4 digits
        if (!invoiceNumber || !/^\d{4}$/.test(invoiceNumber)) {
            showAlert("Invalid Input", "Please enter exactly the last 4 digits of your invoice number.");
            return;
        }

        // Hide input and button, show loading message
        invoiceInput.classList.add('hidden');
        invoiceSubmitButton.classList.add('hidden');
        invoicePromptText.classList.add('hidden'); // Hide prompt text too
        authenticationMessage.classList.remove('hidden');
        authenticationMessage.textContent = "Authenticating...";

        // Simulate authentication delay
        setTimeout(() => {
            authenticationMessage.textContent = "Authenticated successfully!";
            authenticationMessage.classList.add('text-green-600'); // Optional: change color for success

            // After a brief success message, hide modal and start scratch card
            setTimeout(() => {
                invoiceAuthenticationModal.classList.add('hidden'); // Hide the entire modal
                initializeScratchCard(); // Proceed to initialize the scratch card
            }, 500); // Show success message for 0.5 seconds
        }, 2000); // Simulate 2 seconds of loading
    });


    // --- Event Listeners for Scratching ---
    canvas.addEventListener('mousedown', (e) => {
        isScratching = true;
        scratch(getEventPos(e).x, getEventPos(e).y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isScratching) {
            scratch(getEventPos(e).x, getEventPos(e).y);
            if (getScratchedPercentage() >= SCRATCH_PERCENTAGE_THRESHOLD) {
                handleScratchCompletion();
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        isScratching = false;
        if (getScratchedPercentage() >= SCRATCH_PERCENTAGE_THRESHOLD) {
            handleScratchCompletion();
        }
    });

    canvas.addEventListener('mouseleave', () => {
        isScratching = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isScratching = true;
        scratch(getEventPos(e).x, getEventPos(e).y);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isScratching) {
            scratch(getEventPos(e).x, getEventPos(e).y);
            if (getScratchedPercentage() >= SCRATCH_PERCENTAGE_THRESHOLD) {
                handleScratchCompletion();
            }
        }
    });

    canvas.addEventListener('touchend', () => {
        isScratching = false;
        if (getScratchedPercentage() >= SCRATCH_PERCENTAGE_THRESHOLD) {
            handleScratchCompletion();
        }
    });

    // Initial action: Show invoice modal, hide scratch area
    invoiceAuthenticationModal.classList.remove('hidden');
    document.getElementById('scratch-area').classList.add('hidden'); // Ensure scratch area is hidden initially
});
