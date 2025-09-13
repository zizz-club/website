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
        backgroundColor: 0x49123A,
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

// Select the container where the background will be rendered
const container = document.getElementById('threejs-container');

// Create a Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    CONFIG.cameraFOV,
    container.offsetWidth / container.offsetHeight,
    CONFIG.cameraNear,
    CONFIG.cameraFar
);

// Create a Three.js renderer with configurable settings
const renderer = new THREE.WebGLRenderer({
    antialias: CONFIG.enableAntialiasing,
    alpha: CONFIG.enableTransparency,
    powerPreference: "low-power"
});
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
container.appendChild(renderer.domElement);

// Resize the renderer and camera on window resize
function resizeRenderer() {
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);

// Call resizeRenderer initially to set up the correct aspect ratio
resizeRenderer();

// Create a plane geometry for the terrain
const geometry = new THREE.PlaneGeometry(
    CONFIG.terrainWidth,
    CONFIG.terrainHeight,
    CONFIG.terrainSegments,
    CONFIG.terrainSegments
);

// GPU-based shader material with built-in noise and advanced contour rendering
const contourMaterial = new THREE.ShaderMaterial({
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

// Create the contour mesh
const contourMesh = new THREE.Mesh(geometry, contourMaterial);
contourMesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
scene.add(contourMesh);

// Animation variables and enhanced visibility detection
let time = 0;
let lastFrameTime = 0;
let lastTimeUpdate = 0;
const frameInterval = CONFIG.frameInterval;

// Enhanced page visibility detection using Intersection Observer
let isPageVisible = true;
let isContainerVisible = true;

// Traditional visibility API
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
});

// More accurate container visibility detection
const visibilityObserver = new IntersectionObserver((entries) => {
    isContainerVisible = entries[0].isIntersecting;
}, {
    root: null,
    rootMargin: '50px', // Start animating slightly before container is visible
    threshold: 0.1 // Trigger when 10% of container is visible
});

if (container) {
    visibilityObserver.observe(container);
}

// Performance monitoring (development only)
let frameCount = 0;
let lastFPSUpdate = 0;
function updatePerformanceStats(currentTime) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        frameCount++;
        if (currentTime - lastFPSUpdate >= 2000) { // Every 2 seconds
            const fps = Math.round(frameCount / 2);
            if (fps < CONFIG.targetFPS * 0.7) {
                console.warn(`Performance warning: ${fps}fps (target: ${CONFIG.targetFPS}fps)`);
            }
            frameCount = 0;
            lastFPSUpdate = currentTime;
        }
    }
}

// Add ambient light to the scene
const light = new THREE.AmbientLight(0xffffff, 1); // White light
scene.add(light);

// Enhanced animation loop with performance monitoring
function animate(currentTime = 0) {
    // Only animate if page and container are visible and animation is enabled
    const shouldAnimate = isPageVisible && isContainerVisible && CONFIG.enableAnimation;

    if (!shouldAnimate) {
        requestAnimationFrame(animate);
        return;
    }

    // Frame rate limiting
    if (currentTime - lastFrameTime >= frameInterval) {
        // Update time based on real elapsed time, not frame rate
        if (lastTimeUpdate === 0) lastTimeUpdate = currentTime;
        const deltaTime = currentTime - lastTimeUpdate;
        time += CONFIG.noiseSpeed * deltaTime;
        lastTimeUpdate = currentTime;

        // Update shader uniforms
        contourMaterial.uniforms.time.value = time;

        // Render the scene
        renderer.render(scene, camera);
        lastFrameTime = currentTime;

        // Performance monitoring in development
        updatePerformanceStats(currentTime);
    }

    requestAnimationFrame(animate);
}

// Enhanced cleanup function for memory management
function cleanup() {
    // Stop observing
    if (visibilityObserver) {
        visibilityObserver.disconnect();
    }

    // Clean up Three.js resources
    if (geometry) {
        geometry.dispose();
    }
    if (contourMaterial) {
        contourMaterial.dispose();
    }
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
    }

    // Remove event listeners
    window.removeEventListener('resize', resizeRenderer);
    window.removeEventListener('beforeunload', cleanup);
    document.removeEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
    });
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Set up the camera position for a top-down view
camera.position.set(CONFIG.cameraPosition.x, CONFIG.cameraPosition.y, CONFIG.cameraPosition.z);
camera.lookAt(0, 0, 0); // Point the camera at the center of the plane
camera.up.set(0, 0, -1); // Adjust the "up" direction to ensure proper orientation

// Start the animation only if enabled
if (CONFIG.enableAnimation) {
    animate();
} else {
    // For minimal quality, just render once with initial time
    contourMaterial.uniforms.time.value = 0;
    renderer.render(scene, camera);
}
