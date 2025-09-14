// GPU-based noise implementation - no external libraries needed!

// Device capability detection
function getDeviceQuality() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return 'minimal';
    if (isMobile || hasLowMemory) return 'low';
    return 'high';
}

const deviceQuality = getDeviceQuality();

// Base configuration - all values in one place for easy modification
const BASE_CONFIG = {
    // Terrain geometry
    terrain: {
        width: 400,
        height: 200,
        segments: {
            minimal: 50,
            low: 100,
            high: 200
        }
    },

    // Visual appearance
    visual: {
        contourSpacing: 0.9,
        contourLineWidth: 0.06,
        contourColor: 0x1f69b3ff, // #1f69b3ff
        contourMajorColor: 0x1f7ad4ff, // #1f7ad4ff
        backgroundColor: 0x221249ff, // #221249ff
        enableTransparency: true,
        majorLineMultiplier: 5, // Every 5th line is major
        majorLineWidthMultiplier: 1.8, // Major lines are 80% thicker
        enableGlow: true,
        glowIntensity: 0.3
    },

    // Noise settings
    noise: {
        amplitude: 4.0,
        scale: {
            x: 0.015,
            y: 0.015
        },
        speed: {
            minimal: 0.00001,
            low: 0.00002,
            high: 0.00002
        }
    },

    // Performance settings
    performance: {
        targetFPS: {
            minimal: 15,
            low: 24,
            high: 60
        },
        enableAntialiasing: {
            minimal: false,
            low: false,
            high: true
        },
        enableAnimation: {
            minimal: false,
            low: true,
            high: true
        },
        maxPixelRatio: 2
    },

    // Camera configuration
    camera: {
        position: { x: 0, y: 125, z: 0 },
        fov: 75,
        near: 0.1,
        far: 1000
    }
};

// Generate quality-specific configuration
function generateConfig(quality) {
    return {
        // Terrain
        terrainWidth: BASE_CONFIG.terrain.width,
        terrainHeight: BASE_CONFIG.terrain.height,
        terrainSegments: BASE_CONFIG.terrain.segments[quality],

        // Visual
        contourSpacing: BASE_CONFIG.visual.contourSpacing,
        contourLineWidth: BASE_CONFIG.visual.contourLineWidth,
        contourColor: BASE_CONFIG.visual.contourColor,
        contourMajorColor: BASE_CONFIG.visual.contourMajorColor,
        backgroundColor: BASE_CONFIG.visual.backgroundColor,
        enableTransparency: BASE_CONFIG.visual.enableTransparency,
        majorLineMultiplier: BASE_CONFIG.visual.majorLineMultiplier,
        majorLineWidthMultiplier: BASE_CONFIG.visual.majorLineWidthMultiplier,
        enableGlow: BASE_CONFIG.visual.enableGlow,
        glowIntensity: BASE_CONFIG.visual.glowIntensity,

        // Noise
        noiseAmplitude: BASE_CONFIG.noise.amplitude,
        noiseScaleX: BASE_CONFIG.noise.scale.x,
        noiseScaleY: BASE_CONFIG.noise.scale.y,
        noiseSpeed: BASE_CONFIG.noise.speed[quality],

        // Performance
        targetFPS: BASE_CONFIG.performance.targetFPS[quality],
        enableAntialiasing: BASE_CONFIG.performance.enableAntialiasing[quality],
        enableAnimation: BASE_CONFIG.performance.enableAnimation[quality],
        maxPixelRatio: BASE_CONFIG.performance.maxPixelRatio,

        // Camera
        cameraPosition: BASE_CONFIG.camera.position,
        cameraFOV: BASE_CONFIG.camera.fov,
        cameraNear: BASE_CONFIG.camera.near,
        cameraFar: BASE_CONFIG.camera.far,

        // Derived values
        frameInterval: 1000 / BASE_CONFIG.performance.targetFPS[quality]
    };
}

// Apply quality-specific configuration
const CONFIG = generateConfig(deviceQuality);

// Background system state management
class BackgroundSystem {
    constructor() {
        this.initialized = false;
        this.isAnimationRunning = false;
        this.animationFrameId = null;
        this.isPaused = false;
        
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.geometry = null;
        this.contourMaterial = null;
        this.contourMesh = null;
        this.light = null;
        
        // DOM and observers
        this.container = null;
        this.visibilityObserver = null;
        
        // Animation state
        this.time = 0;
        this.lastFrameTime = 0;
        this.lastTimeUpdate = 0;
        this.frameInterval = CONFIG.frameInterval;
        
        // Visibility tracking
        this.isPageVisible = true;
        this.isContainerVisible = true;
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        // Bind event handlers
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handlePageShow = this.handlePageShow.bind(this);
        this.handlePageHide = this.handlePageHide.bind(this);
        this.animate = this.animate.bind(this);
    }

    // Initialize the background system
    initialize() {
        // Get container
        this.container = document.getElementById('threejs-container');
        if (!this.container) {
            console.warn('Three.js container not found. Background animation will not start.');
            return false;
        }

        // Check if already initialized with existing DOM content
        if (this.initialized && this.container.children.length > 0 && this.renderer && !this.renderer.disposed) {
            if (this.isPaused && CONFIG.enableAnimation) {
                this.resume();
            }
            return true;
        }

        // Clean up any partial state before reinitializing
        if (this.renderer && this.renderer.disposed) {
            this.cleanup();
        }

        try {
            this.createScene();
            this.createRenderer();
            this.createGeometry();
            this.createMaterial();
            this.createMesh();
            this.setupCamera();
            this.setupLighting();
            this.setupEventListeners();
            this.setupVisibilityObserver();
            
            this.initialized = true;
            
            // Start animation if enabled
            if (CONFIG.enableAnimation) {
                this.start();
            } else {
                this.renderOnce();
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to initialize background system:', error);
            this.cleanup();
            return false;
        }
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.cameraFOV,
            this.container.offsetWidth / this.container.offsetHeight,
            CONFIG.cameraNear,
            CONFIG.cameraFar
        );
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.enableAntialiasing,
            alpha: CONFIG.enableTransparency,
            powerPreference: "low-power"
        });
        
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
        this.container.appendChild(this.renderer.domElement);
    }

    createGeometry() {
        this.geometry = new THREE.PlaneGeometry(
            CONFIG.terrainWidth,
            CONFIG.terrainHeight,
            CONFIG.terrainSegments,
            CONFIG.terrainSegments
        );
    }

    createMaterial() {
        this.contourMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                noiseScale: { value: new THREE.Vector2(CONFIG.noiseScaleX, CONFIG.noiseScaleY) },
                noiseAmplitude: { value: CONFIG.noiseAmplitude },
                contourSpacing: { value: CONFIG.contourSpacing },
                contourLineWidth: { value: CONFIG.contourLineWidth },
                contourColor: { value: new THREE.Color(CONFIG.contourColor) },
                contourMajorColor: { value: new THREE.Color(CONFIG.contourMajorColor) },
                majorLineMultiplier: { value: CONFIG.majorLineMultiplier },
                majorLineWidthMultiplier: { value: CONFIG.majorLineWidthMultiplier },
                glowIntensity: { value: CONFIG.glowIntensity }
            },
            vertexShader: `
                varying float vElevation;
                varying vec3 vPosition;
                uniform float time;
                uniform vec2 noiseScale;
                uniform float noiseAmplitude;

                // GPU-based 3D noise function - much faster than CPU
                vec3 mod289(vec3 x) {
                    return x - floor(x * (1.0 / 289.0)) * 289.0;
                }

                vec4 mod289(vec4 x) {
                    return x - floor(x * (1.0 / 289.0)) * 289.0;
                }

                vec4 permute(vec4 x) {
                    return mod289(((x * 34.0) + 1.0) * x);
                }

                vec4 taylorInvSqrt(vec4 r) {
                    return 1.79284291400159 - 0.85373472095314 * r;
                }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);

                    vec4 x = x_ * ns.x + ns.yyyy;
                    vec4 y = y_ * ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);

                    vec4 s0 = floor(b0) * 2.0 + 1.0;
                    vec4 s1 = floor(b1) * 2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
                }

                void main() {
                    vPosition = position;

                    // Calculate noise-based elevation on GPU
                    vec3 noisePos = vec3(position.x * noiseScale.x, position.y * noiseScale.y, time);
                    float noiseValue = snoise(noisePos);

                    // Apply height variation
                    vec3 newPosition = position;
                    newPosition.z = noiseValue * noiseAmplitude;
                    vElevation = newPosition.z;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying float vElevation;
                varying vec3 vPosition;
                uniform float contourSpacing;
                uniform float contourLineWidth;
                uniform vec3 contourColor;
                uniform vec3 contourMajorColor;
                uniform float majorLineMultiplier;
                uniform float majorLineWidthMultiplier;
                uniform float glowIntensity;

                void main() {
                    // Enhanced contour lines with major/minor distinction
                    float elevation = vElevation;

                    // Get screen-space derivatives for consistent line width
                    float dx = dFdx(elevation);
                    float dy = dFdy(elevation);
                    float gradient = length(vec2(dx, dy));

                    // Calculate which contour line this pixel is near
                    float contourValue = elevation / contourSpacing;
                    float contourIndex = round(contourValue);
                    float contourFraction = fract(contourValue + 0.5) - 0.5;
                    float distanceToContour = abs(contourFraction) * contourSpacing;

                    // Determine if this is a major contour line
                    bool isMajorLine = mod(contourIndex, majorLineMultiplier) == 0.0;

                    // Normalize distance by gradient for consistent visual width
                    float normalizedDistance = distanceToContour / max(gradient, 0.0001);

                    // Calculate line width (major lines are thicker)
                    float currentLineWidth = isMajorLine ?
                        contourLineWidth * majorLineWidthMultiplier * 15.0 :
                        contourLineWidth * 15.0;

                    // Use smoothstep for better antialiasing
                    float antialiasWidth = currentLineWidth * 0.5;
                    float lineIntensity = 1.0 - smoothstep(
                        currentLineWidth - antialiasWidth,
                        currentLineWidth + antialiasWidth,
                        normalizedDistance
                    );

                    // Add subtle glow effect
                    float glowDistance = normalizedDistance * 2.0;
                    float glow = exp(-glowDistance * glowDistance) * glowIntensity;

                    // Combine line and glow
                    float totalIntensity = lineIntensity + glow;

                    if (totalIntensity > 0.05) {
                        // Choose color based on line type
                        vec3 finalColor = isMajorLine ? contourMajorColor : contourColor;

                        // Blend between line color and glow
                        if (lineIntensity > 0.1) {
                            gl_FragColor = vec4(finalColor, lineIntensity);
                        } else {
                            // Glow only
                            gl_FragColor = vec4(finalColor, glow * 0.6);
                        }
                    } else {
                        discard;
                    }
                }
            `,
            transparent: true
        });
    }

    createMesh() {
        this.contourMesh = new THREE.Mesh(this.geometry, this.contourMaterial);
        this.contourMesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
        this.scene.add(this.contourMesh);
    }

    setupCamera() {
        this.camera.position.set(CONFIG.cameraPosition.x, CONFIG.cameraPosition.y, CONFIG.cameraPosition.z);
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, -1);
    }

    setupLighting() {
        this.light = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(this.light);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pageshow', this.handlePageShow);
        window.addEventListener('pagehide', this.handlePageHide);
    }

    setupVisibilityObserver() {
        this.visibilityObserver = new IntersectionObserver((entries) => {
            this.isContainerVisible = entries[0].isIntersecting;
        }, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });

        if (this.container) {
            this.visibilityObserver.observe(this.container);
        }
    }

    // Event handlers
    handleResize() {
        if (!this.renderer || !this.camera || !this.container) {
            return;
        }
        
        try {
            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
            this.camera.updateProjectionMatrix();
        } catch (error) {
            console.warn('Resize error (likely during cleanup):', error);
        }
    }

    handleVisibilityChange() {
        this.isPageVisible = !document.hidden;
    }

    handlePageShow(event) {
        // If page was restored from bfcache, reinitialize if needed
        if (event.persisted || !this.initialized || !this.container.children.length) {
            setTimeout(() => {
                this.initialize();
            }, 100); // Small delay to ensure DOM is ready
        } else if (this.isPaused) {
            this.resume();
        }
    }

    handlePageHide(event) {
        // Only pause for actual navigation, not for bfcache
        if (!event.persisted) {
            this.pause();
        }
    }

    // Animation control
    start() {
        if (this.isAnimationRunning) return;
        
        this.isAnimationRunning = true;
        this.isPaused = false;
        this.animate();
    }

    pause() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isAnimationRunning = false;
        this.isPaused = true;
    }

    resume() {
        if (!this.isPaused || this.isAnimationRunning) return;
        
        if (CONFIG.enableAnimation) {
            this.start();
        }
    }

    stop() {
        this.pause();
        this.isPaused = false;
    }

    // Animation loop
    animate(currentTime = 0) {
        if (!this.isAnimationRunning) {
            return;
        }

        const shouldAnimate = this.isPageVisible && this.isContainerVisible && CONFIG.enableAnimation;

        if (!shouldAnimate) {
            this.animationFrameId = requestAnimationFrame(this.animate);
            return;
        }

        // Frame rate limiting
        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            // Update time based on real elapsed time
            if (this.lastTimeUpdate === 0) this.lastTimeUpdate = currentTime;
            const deltaTime = currentTime - this.lastTimeUpdate;
            this.time += CONFIG.noiseSpeed * deltaTime;
            this.lastTimeUpdate = currentTime;

            // Update shader uniforms - check if material still exists
            if (this.contourMaterial && this.contourMaterial.uniforms) {
                this.contourMaterial.uniforms.time.value = this.time;
            }

            // Render the scene with error handling
            try {
                if (this.renderer && this.scene && this.camera && !this.renderer.disposed) {
                    this.renderer.render(this.scene, this.camera);
                }
            } catch (error) {
                console.warn('Render error (likely during cleanup):', error);
                this.stop();
                return;
            }
            
            this.lastFrameTime = currentTime;
            this.updatePerformanceStats(currentTime);
        }

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    // Render once for minimal quality mode
    renderOnce() {
        if (this.contourMaterial && this.contourMaterial.uniforms) {
            this.contourMaterial.uniforms.time.value = 0;
        }
        
        try {
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.warn('Initial render error:', error);
        }
    }

    // Performance monitoring
    updatePerformanceStats(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            // Optional: Add FPS display here for development
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }

    // Cleanup resources
    cleanup() {
        this.stop();

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('pageshow', this.handlePageShow);
        window.removeEventListener('pagehide', this.handlePageHide);

        // Stop observing
        if (this.visibilityObserver) {
            this.visibilityObserver.disconnect();
            this.visibilityObserver = null;
        }

        // Clean up Three.js resources
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        
        if (this.contourMaterial) {
            if (this.contourMaterial.uniforms) {
                Object.values(this.contourMaterial.uniforms).forEach(uniform => {
                    if (uniform.value && typeof uniform.value.dispose === 'function') {
                        uniform.value.dispose();
                    }
                });
            }
            this.contourMaterial.dispose();
            this.contourMaterial = null;
        }
        
        if (this.renderer) {
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer = null;
        }

        // Reset state
        this.initialized = false;
        this.scene = null;
        this.camera = null;
        this.contourMesh = null;
        this.light = null;
        this.time = 0;
        this.lastFrameTime = 0;
        this.lastTimeUpdate = 0;
    }
}

// Create and initialize the background system
const backgroundSystem = new BackgroundSystem();

// Additional check for back button scenarios
function checkAndReinitialize() {
    const container = document.getElementById('threejs-container');
    if (container && container.children.length === 0 && !backgroundSystem.isAnimationRunning) {
        backgroundSystem.initialize();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        backgroundSystem.initialize();
        // Check again after a short delay in case of timing issues
        setTimeout(checkAndReinitialize, 500);
    });
} else {
    backgroundSystem.initialize();
    // Check again after a short delay in case of timing issues
    setTimeout(checkAndReinitialize, 500);
}

// Global cleanup for beforeunload (complete page navigation)
window.addEventListener('beforeunload', () => {
    // Only cleanup on real navigation, not back/forward
    if (!performance.navigation || performance.navigation.type !== 2) {
        backgroundSystem.cleanup();
    }
});

// Lightweight fallback check for browsers with unreliable pageshow events
let backgroundCheckCount = 0;
const maxBackgroundChecks = 3; // Only check 3 times, then stop

function lightweightBackgroundCheck() {
    if (backgroundCheckCount >= maxBackgroundChecks) return;
    
    const container = document.getElementById('threejs-container');
    if (container && container.children.length === 0 && document.visibilityState === 'visible' && !backgroundSystem.isAnimationRunning) {
        backgroundCheckCount++;
        backgroundSystem.initialize();
    }
}

// Use requestIdleCallback for better performance, with setTimeout fallback
if (window.requestIdleCallback) {
    // Check during browser idle time to avoid performance issues
    const scheduleCheck = () => {
        if (backgroundCheckCount < maxBackgroundChecks) {
            requestIdleCallback(() => {
                lightweightBackgroundCheck();
                setTimeout(scheduleCheck, 5000); // Schedule next check
            });
        }
    };
    setTimeout(scheduleCheck, 1000); // Start after 1 second
} else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
        lightweightBackgroundCheck();
        if (backgroundCheckCount < maxBackgroundChecks) {
            setTimeout(() => lightweightBackgroundCheck(), 5000);
        }
    }, 1000);
}