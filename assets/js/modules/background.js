// Import a Perlin noise library (e.g., `simplex-noise` or any other library)
// You can include a library like `simplex-noise` via a CDN or npm
// Example: <script src="https://cdnjs.cloudflare.com/ajax/libs/simplex-noise/2.4.0/simplex-noise.min.js"></script>
const noise = new SimplexNoise(); // Initialize the noise generator

// Configurable variables
const CONFIG = {
    planeWidth: 400, // Width of the plane
    planeHeight: 200, // Height of the plane
    planeSegments: 300, // Number of segments for the plane geometry
    contourSpacing: 1.4, // Spacing between contour lines
    lineColor: 0x4da6ff, // Soft blue color for the contour lines
    lineThickness: 0.02, // Thickness of the contour lines
    cameraPosition: { x: 0, y: 125, z: 0 }, // Camera position for top-down view
    backgroundColor: 0x2e2e2e, // Light gray background color
    backgroundAlpha: true, // Enable or disable transparency
    noiseSpeed: 0.0005, // Speed of the noise evolution
    heightAmplitude: 4, // Amplitude of the heightmap
    noiseScaleX: 0.015, // Scale of the noise on the X axis
    noiseScaleY: 0.015 // Scale of the noise on the Y axis
};

// Select the container where the background will be rendered
const container = document.getElementById('threejs-container');

// Create a Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);

// Create a Three.js renderer with configurable alpha
const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: CONFIG.backgroundAlpha // Use the configurable alpha setting
});
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Remove or comment out the following line to avoid setting a background color
// renderer.setClearColor(CONFIG.backgroundColor); 
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
const geometry = new THREE.PlaneGeometry(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeSegments, CONFIG.planeSegments);

// Material for the contour lines
const contourMaterial = new THREE.ShaderMaterial({
    uniforms: {
        elevation: { value: geometry.attributes.position.array },
        contourSpacing: { value: CONFIG.contourSpacing }, // Spacing between contour lines
        lineColor: { value: new THREE.Color(CONFIG.lineColor) } // Contour line color
    },
    vertexShader: `
        varying float vElevation;
        void main() {
            vElevation = position.z; // Pass elevation to fragment shader
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying float vElevation;
        uniform float contourSpacing;
        uniform vec3 lineColor;
        void main() {
            // Calculate contour lines
            float contour = mod(vElevation, contourSpacing);
            if (contour < 0.05) { // Render hard lines with a small threshold
                gl_FragColor = vec4(lineColor, 1.0); // Fully opaque line color
            } else {
                discard; // Skip non-line areas
            }
        }
    `,
    transparent: true // Allow transparency for non-line areas
});

// Create the contour mesh
const contourMesh = new THREE.Mesh(geometry, contourMaterial);
contourMesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
scene.add(contourMesh);

// Generate heightmap for the terrain
let time = 0; // Time variable for noise evolution

function generateHeightmap() {
    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        // Use Perlin noise for smoother, non-repeating patterns
        const noiseValue = noise.noise3D(
            x * CONFIG.noiseScaleX, // Scale noise on X axis
            y * CONFIG.noiseScaleY, // Scale noise on Y axis
            time // Use time for smooth evolution
        );

        // Scale the noise value to create height variations
        vertices[i + 2] = noiseValue * CONFIG.heightAmplitude;
    }

    geometry.attributes.position.needsUpdate = true; // Notify Three.js of geometry changes
    geometry.computeVertexNormals(); // Recalculate normals for lighting

    // Update the elevation uniform
    contourMaterial.uniforms.elevation.value = vertices;
}

// Add ambient light to the scene
const light = new THREE.AmbientLight(0xffffff, 1); // White light
scene.add(light);

// Animation loop
function animate() {
    time += CONFIG.noiseSpeed; // Increment time for noise evolution
    generateHeightmap();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Set up the camera position for a top-down view
camera.position.set(CONFIG.cameraPosition.x, CONFIG.cameraPosition.y, CONFIG.cameraPosition.z); // Directly above the plane
camera.lookAt(0, 0, 0); // Point the camera at the center of the plane
camera.up.set(0, 0, -1); // Adjust the "up" direction to ensure proper orientation

// Start the animation
animate();
