// Configurable video modal and playback functionality
// Usage: Set window.courseVideoId in the page before loading this script

document.addEventListener('DOMContentLoaded', () => {
    // Get video ID from page config
    const videoId = window.courseVideoId || 's_qQfOitQIs'; // Default fallback

    // Create video modal
    const videoModal = document.createElement('div');
    videoModal.id = 'videoModal';
    videoModal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/80 p-4';
    videoModal.innerHTML = `
        <div class="relative w-full max-w-5xl">
            <button id="closeVideoModal" class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors">
                <span class="material-symbols-outlined text-4xl">close</span>
            </button>
            <div class="relative pb-[56.25%] h-0 bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe id="youtubePlayer" class="absolute top-0 left-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(videoModal);

    // Function to open video
    function playVideo(customVideoId) {
        const iframe = document.getElementById('youtubePlayer');
        const vidId = customVideoId || videoId;
        iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
        videoModal.classList.remove('hidden');
        videoModal.classList.add('flex');
    }

    // Function to close video
    function closeVideo() {
        const iframe = document.getElementById('youtubePlayer');
        iframe.src = '';
        videoModal.classList.add('hidden');
        videoModal.classList.remove('flex');
    }

    // Close button handler
    document.getElementById('closeVideoModal').addEventListener('click', closeVideo);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
            closeVideo();
        }
    });

    // Close when clicking outside the video
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideo();
        }
    });

    // Target PLAY BUTTONS and VIDEO PLAYER elements
    // Look for common play button patterns
    const playButtons = document.querySelectorAll(`
        button[class*="play"],
        [class*="play-button"],
        [class*="play_arrow"],
        button:has(.material-symbols-outlined:is([class*="play"])),
        button:has(span.material-symbols-outlined)
    `);

    playButtons.forEach(button => {
        // Check if button contains play icon text
        const iconText = button.querySelector('.material-symbols-outlined');
        if (iconText && (iconText.textContent.includes('play') || iconText.textContent.includes('arrow'))) {
            button.style.cursor = 'pointer';
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                playVideo();
            });
        }
    });

    // Also look for "video" or "vedeo" text and make them clickable (original feature)
    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes('video') || pageText.includes('vedeo')) {
        const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
        allElements.forEach(el => {
            const text = el.textContent.toLowerCase().trim();
            if ((text.includes('video') || text.includes('vedeo')) && text.length < 100) {
                el.style.cursor = 'pointer';
                el.style.color = '#3b82f6';
                el.style.textDecoration = 'underline';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playVideo();
                });
            }
        });
    }

    // Also add click handlers to first course card as backup
    const firstCourseCard = document.querySelector('.group.bg-white.dark\\:bg-dark-card.rounded-2xl');
    if (firstCourseCard) {
        firstCourseCard.style.cursor = 'pointer';
        firstCourseCard.addEventListener('click', (e) => {
            if (!e.target.matches('input[type="checkbox"]') && !e.target.closest('label') && !e.target.closest('button') && !e.target.closest('a')) {
                playVideo();
            }
        });
    }

    // Expose function globally
    window.playVideo = playVideo;
    window.closeVideo = closeVideo;
});
