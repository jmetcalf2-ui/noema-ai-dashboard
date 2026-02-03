/**
 * WebGL2 Context Manager
 * Handles WebGL2 context creation, resize, and cleanup
 */

export interface WebGLContextConfig {
    alpha?: boolean;
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    preserveDrawingBuffer?: boolean;
}

export class WebGL2Context {
    public gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private extensions: Map<string, any> = new Map();

    constructor(canvas: HTMLCanvasElement, config: WebGLContextConfig = {}) {
        this.canvas = canvas;

        const gl = canvas.getContext('webgl2', {
            alpha: config.alpha ?? false,
            antialias: config.antialias ?? true,
            depth: config.depth ?? false,
            stencil: config.stencil ?? false,
            preserveDrawingBuffer: config.preserveDrawingBuffer ?? false,
            powerPreference: 'high-performance'
        });

        if (!gl) {
            throw new Error('WebGL2 not supported');
        }

        this.gl = gl;
        this.loadExtensions();
    }

    private loadExtensions() {
        const extensionsToLoad = [
            'EXT_color_buffer_float',
            'OES_texture_float_linear',
            'EXT_float_blend'
        ];

        for (const ext of extensionsToLoad) {
            const extension = this.gl.getExtension(ext);
            if (extension) {
                this.extensions.set(ext, extension);
            } else {
                console.warn(`WebGL2 extension ${ext} not available`);
            }
        }
    }

    public hasExtension(name: string): boolean {
        return this.extensions.has(name);
    }

    public resize(width: number, height: number, devicePixelRatio: number = 1) {
        const w = Math.floor(width * devicePixelRatio);
        const h = Math.floor(height * devicePixelRatio);

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.gl.viewport(0, 0, w, h);
        }
    }

    public clear(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    public destroy() {
        const ext = this.gl.getExtension('WEBGL_lose_context');
        if (ext) {
            ext.loseContext();
        }
    }
}

/**
 * Shader Compilation Utilities
 */
export function compileShader(
    gl: WebGL2RenderingContext,
    source: string,
    type: number
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Failed to create shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${log}`);
    }

    return shader;
}

export function linkProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('Failed to create program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program linking failed: ${log}`);
    }

    return program;
}

export function createProgram(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram {
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
    const program = linkProgram(gl, vertexShader, fragmentShader);

    // Shaders can be deleted after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}

/**
 * Buffer creation utilities
 */
export function createBuffer(
    gl: WebGL2RenderingContext,
    data: Float32Array | Uint16Array | Uint32Array,
    usage: number = WebGL2RenderingContext.STATIC_DRAW
): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) {
        throw new Error('Failed to create buffer');
    }

    const target = data instanceof Uint16Array || data instanceof Uint32Array
        ? gl.ELEMENT_ARRAY_BUFFER
        : gl.ARRAY_BUFFER;

    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);
    gl.bindBuffer(target, null);

    return buffer;
}
