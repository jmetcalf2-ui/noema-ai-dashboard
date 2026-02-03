/**
 * GPU-based picking for hover and selection
 * Renders object IDs to an off-screen framebuffer, then reads pixel values
 */

import { WebGL2Context, createProgram } from '../gl';
import { pointVertexShader, pickingFragmentShader } from '../shaders';

export class GPUPicker {
    private gl: WebGL2RenderingContext;
    private pickFBO: WebGLFramebuffer;
    private pickTexture: WebGLTexture;
    private pickDepthBuffer: WebGLRenderbuffer;
    private pickProgram: WebGLProgram;
    private width: number = 0;
    private height: number = 0;

    constructor(glContext: WebGL2Context) {
        this.gl = glContext.gl;

        // Create framebuffer for picking
        const fbo = this.gl.createFramebuffer();
        if (!fbo) throw new Error('Failed to create picking framebuffer');
        this.pickFBO = fbo;

        // Create texture for color attachment
        const texture = this.gl.createTexture();
        if (!texture) throw new Error('Failed to create picking texture');
        this.pickTexture = texture;

        // Create depth buffer
        const depthBuffer = this.gl.createRenderbuffer();
        if (!depthBuffer) throw new Error('Failed to create picking depth buffer');
        this.pickDepthBuffer = depthBuffer;

        // Create picking shader program
        this.pickProgram = createProgram(
            this.gl,
            pointVertexShader,
            pickingFragmentShader
        );
    }

    public resize(width: number, height: number) {
        if (this.width === width && this.height === height) return;

        this.width = width;
        this.height = height;

        const gl = this.gl;

        // Setup texture
        gl.bindTexture(gl.TEXTURE_2D, this.pickTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Setup depth buffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.pickDepthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

        // Attach to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFBO);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.pickTexture,
            0
        );
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            this.pickDepthBuffer
        );

        // Check framebuffer status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Picking framebuffer incomplete: ${status}`);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public pick(x: number, y: number): number {
        const gl = this.gl;

        // Bind picking framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFBO);

        // Read pixel at mouse position
        // Note: WebGL uses bottom-left origin, need to flip Y
        const pixelY = this.height - y;
        const pixel = new Uint8Array(4);
        gl.readPixels(x, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        // Decode ID from RGB
        const id = (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return id;
    }

    public renderForPicking(renderCallback: (program: WebGLProgram) => void) {
        const gl = this.gl;

        // Bind picking framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFBO);
        gl.viewport(0, 0, this.width, this.height);

        // Clear
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use picking program
        gl.useProgram(this.pickProgram);

        // Let caller render with this program
        renderCallback(this.pickProgram);

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public destroy() {
        const gl = this.gl;
        gl.deleteFramebuffer(this.pickFBO);
        gl.deleteTexture(this.pickTexture);
        gl.deleteRenderbuffer(this.pickDepthBuffer);
        gl.deleteProgram(this.pickProgram);
    }
}
