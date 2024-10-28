// ERROR CODEs
const SIZE_MISMATCH = "ERROR: Size mismatch between blended images"
const FAILED_LOAD   = "ERROR: Failed to open an image file, link may be broken"
const NOT_IMG_TYPE  = "ERROR: Provided image data is not requisite image data structure"

// other constants
const IMG_W = 1000;
const IMG_H = 1000;
const IMG_S = 1000;
const RELATIVE_SCALE = 0.5;
const MAX_BRUSH_SIZE = 50;
const MIN_BRUSH_SIZE = 0.5;
const MAX_BLUR = 15;
const CANV_S = 500;
const MIN_CANV_S = 250;
const MAX_CANV_S = 1000;
const MIN_USER_SCALE = 0.25;
const MID_USER_SCALE = 1.00;
const GRADIENT_SCALE = 0.70;
const GRADIENT_ANGLE = Math.PI/6;
const RING = 'ring';
const SQUARE = 'square';
const UNDO_STACK_SIZE = 5;


// Image paths for component images
// single ring
const single_ring_alpha_path = "img/ring/single_alpha.webp";
const single_ring_overlay_path = "img/ring/single_overlay.webp";
const single_ring_bevel_path = "img/ring/single_bevel.webp";
const single_ring_overshadow_path = "img/ring/single_overshadow.webp";
// double ring
const double_ring_alpha_path = "img/ring/double_alpha.webp";
const double_ring_bevel_path = "img/ring/double_bevel.webp";
const double_ring_overlay_path = "img/ring/double_overlay.webp"
const double_ring_overshadow_path = "img/ring/double_overshadow.webp";
// ring generic
const ring_inner_shadow_path = "img/ring/inner_shadow.webp";
const circ_token_alpha_path = "img/ring/token_art_alpha.webp";
// single square
const single_square_alpha_path = "img/square/single_alpha.webp";
const single_square_overlay_path = "img/square/single_overlay.webp";
const single_square_bevel_path = "img/square/single_bevel.webp";
const single_square_overshadow_path = "img/square/single_overshadow.webp";
// double square
const double_square_alpha_path = "img/square/double_alpha.webp";
const double_square_bevel_path = "img/square/double_bevel.webp";
const double_square_overlay_path = "img/square/double_overlay.webp"
const double_square_overshadow_path = "img/square/double_overshadow.webp";
// square generic
const square_inner_shadow_path = "img/square/inner_shadow.webp";
// generic
const stone_texture_path = "img/stone_texture.webp";

// contants for content ids
const col1_id = 'color1';               // input field for first gradient color
const col2_id = 'color2';               // input field for second gradient color
const file_id = 'fileInput';            // file input field for token art
const can_in_id = 'canvas';             // canvas to display token art source image
const can_out_id = 'canvas_fin';        // canvas to display / draw final token
const can_overlay_id = 'canvas_overlay';// canvas for border overlay;
const scale_id = 'slider1';             // slider for adjusting token art scale
const pan_h_id = 'slider2';             // slider for panning token art horizontally
const pan_v_id = 'slider3';             // slider for panning token art vertically
const ring_count_id = 'ring_count';     // toggle for double ring mode
const whiteboard_id = 'canvas_draw';
const erase_toggle_id = 'erase_mode';
const brush_size_id = 'brush_slider';
const clear_peek_id = 'clear_whiteboard';
const blur_radius_id = 'blur_input';
const save_id = 'save_image_button';
const ftype_id = 'file_type_dropdown';
const tokenize_id = 'tokenize_button';
const img_size_id = 'image_size_dropdown';
const canvas_size_id = 'canvas_size_input';
const border_style_id = 'border_type';

let img_s          = IMG_S;
let canv_s         = CANV_S;
let rel_scale      = CANV_S/IMG_S;
let art_base_scale = 1.0;
let art_user_scale = 1.0;
let art_offset_x   = 0.0;
let art_offset_y   = 0.0;
let art_offset_user_x = 0.0;
let art_offset_user_y = 0.0;
let art_width      = img_s;
let art_height     = img_s;
let brush_size     = 0.5*(MAX_BRUSH_SIZE-MIN_BRUSH_SIZE)+MIN_BRUSH_SIZE;
let blur_radius    = 0;

let whiteboard_erase = false;

// background / universal canvases
const art_canvas    = document.createElement('canvas');
const art_context  = art_canvas.getContext('2d');
const token_art_canvas = document.createElement('canvas');
const token_art_context  = token_art_canvas.getContext('2d');
token_art_canvas.width = img_s;
token_art_canvas.height = img_s;
const token_canvas = document.createElement('canvas');
const token_context = token_canvas.getContext('2d');
token_canvas.width = img_s;
token_canvas.height = img_s;
const peek_canvas = document.createElement('canvas');
const peek_context = peek_canvas.getContext('2d');
peek_canvas.width = img_s;
peek_canvas.height = img_s;
const resized_canvas = document.createElement('canvas');
const resized_context  = resized_canvas.getContext('2d');
resized_canvas.width = img_s;
resized_canvas.height = img_s;

let undo_whiteboard_stack = [];
let redo_whiteboard_stack = [];

/** 
 * performs an alpha channel mask by pasting the source image
 * on top of the destination image (this overwrites the destination)
 * 
 * @param srcContext: canvas context containing the source image to mask
 * @param destinationContext: canvas context containing the alpha values
 *      to mask on to, this is also the output context
 * @param width: int containing the width of the (final) image
 * @param height: int containing the height of the (final) image
 */
function clipOnto(srcContext, destinationContext, width, height)
{
    src = srcContext.getImageData(0, 0, width, height).data;
    let dstD = destinationContext.getImageData(0, 0, width, height);
    let dst = dstD.data;
    
    let len = dst.length;
    for (let i = 0; i < len; i += 4)
    {
        dst[i  ]  = src[i  ];
        dst[i+1]  = src[i+1];
        dst[i+2]  = src[i+2];
        dst[i+3]  = (dst[i+3]*src[i+3])/255;
    }
    destinationContext.putImageData(dstD, 0, 0);
}

/** 
 * performs an alpha channel mask by pasting the source image
 * on top of the destination image (this overwrites the destination)
 * 
 * @param srcContext: canvas context containing the source image to mask
 * @param maskContext: canvas context containing the alpha values
 *      to mask on to, this is also the output context
 * @param width: int containing the width of the (final) image
 * @param height: int containing the height of the (final) image
 */
function alphaMask(srcContext, maskContext, width, height)
{
    const srcD = srcContext.getImageData(0, 0, width, height);
    let src = srcD.data;
    const mskD = maskContext.getImageData(0, 0, width, height);
    let msk = mskD.data;
    
    let len = src.length;
    for (let i = 0; i < len; i += 4)
    {
        src[i+3]  = (msk[i+3]*src[i+3])/255;
    }
    srcContext.putImageData(srcD, 0, 0);
}


/**
 * Function to create a new canvas with a gradient
 *
 * @param width: int width of canvas to make
 * @param height: int height of canvas to make
 * @param color1: color for first color stop (css color)
 * @param color2: color for second color stop (css color)
 * @param scale: what percentage of the gradient should the two points take (0.0-1.0)
 * @param angle: angle in radians for gradient
 */
function createGradient(width, height, color1, color2, scale, angle)
{
    // create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    angle %= Math.PI/2;
    
    let hw = width/2;  // half-width
    let hh = height/2; // half-height
    let op = Math.tan(angle)*hh; // opposite = tan*adjacent
    let x0 = hw-op;
    let x1 = hw+op;
    let y0 = 0;
    let y1 = height;
    
    // create gradient
    const gradient = context.createLinearGradient(x0, y0, x1, y1);
    // set stops
    let pad = (1.0-scale)/2;
    gradient.addColorStop(  pad, color1);
    gradient.addColorStop(1-pad, color2);
    
    // fill gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    return canvas;
}

/** 
 * overlays a color on a canvas
 *
 * @param canvas: canvas to apply color overlay
 * @param color: rgb values for color, contains .r .g .b
 */
function colorOverlay(canvas, color)
{
    const context = canvas.getContext('2d');
    let imgD = context.getImageData(0, 0, canvas.width, canvas.height);
    let img = imgD.data;
    for (let i = 0; i < img.length; i += 4)
    {
        img[i  ] = color.r;
        img[i+1] = color.g;
        img[i+2] = color.b;
    }
    context.putImageData(imgD, 0, 0);
}
/** 
 * applies a box blur to a canvas
 *
 * @param canvas: canvas to apply color overlay
 * @param radius: radius for blur
 */
function boxBlur(canvas, radius)
{   
    if (radius <= 0)
    {
        return;
    }
    console.log(`Starting box blur operation with radius=${radius}`);
    const context = canvas.getContext('2d');
    let imgD = context.getImageData(0, 0, canvas.width, canvas.height);
    let img = imgD.data;
    let len = img.length;
    let count = 0;
    for (let x = 0; x < canvas.width; x++)
    {
        for (let y = 0; y < canvas.width; y++)
        {
            let px = (y*canvas.width + x)*4;
            let col = {r: img[px], g: img[px+1], b: img[px+2], a: img[px+3]};
            // sum all color values in blur radius
            for (let i = -radius; i < radius; i++)
            {
                for (let j = -radius; j < radius; j++)
                {
                    let xPos = x + i;
                    let yPos = y + j;
                    
                    if (xPos < 0 || xPos > canvas.width || yPos < 0 || yPos > canvas.height)
                    {
                        continue;
                    }
                    let pxB = (yPos*canvas.width + xPos)*4;
                    col.r += img[pxB  ];
                    col.g += img[pxB+1];
                    col.b += img[pxB+2];
                    col.a += img[pxB+3];
                }
            }
            // average color values
            let area = Math.pow(radius*2,2);
            col.r /= area;
            col.g /= area;
            col.b /= area;
            col.a /= area;
            
            // set pixel values from color
            img[px  ] = col.r;
            img[px+1] = col.g;
            img[px+2] = col.b;
            img[px+3] = col.a;
        }
    }
    console.log('Finished Box Blur');
    context.putImageData(imgD, 0, 0);
}

// Function to read image data from file and save it as raw data
async function canvasFromPath(path)
{
    // return value
    var canvas = document.createElement('canvas');
    // create image and set source
    var img = new Image();
    const promise = new Promise( resolve =>
    {
        // function to run when image is loaded
        img.onload = () =>
        {
            //// create a temporary canvas to get image data
            //canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            resolve();
        };
        img.src = path;
    });
    
    await promise;
    // save image data
    return canvas;
}

/**
 * Function to convert a hex string to css rgb string
 *
 * @param hex: string containing the hex code
 */
function hexToRGB(hex)
{
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

// Resets transform sliders
function resetSliders()
{
    $("#"+scale_id).val(50).change();
    $("#"+pan_h_id).val(50).change();
    $("#"+pan_v_id).val(50).change();
}


let tokenizing = false; // bool to prevent trying to render multiple times at once
// create token
async function tokenize()
{
    // abort if already running
    if (tokenizing) {return false;}
    tokenizing = true;
    
    // set cursor to loading
    document.body.className = 'waiting';
    
    await displayPreview();
    
    // create canvases for all components
    let alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = img_s;
    alphaCanvas.height = img_s;
    let borderCanvas;
    let bevelCanvas;
    let overshadowCanvas;
    let shadowCanvas;
    if (!document.getElementById(border_style_id).checked)
    {
        // ring
        if (!document.getElementById(ring_count_id).checked)
        {
            // single
            borderCanvas = await canvasFromPath(single_ring_alpha_path);
            bevelCanvas = await canvasFromPath(single_ring_bevel_path);
            overshadowCanvas = await canvasFromPath(single_ring_overshadow_path);
        }
        else
        {
            // double
            borderCanvas = await canvasFromPath(double_ring_alpha_path);
            bevelCanvas = await canvasFromPath(double_ring_bevel_path);
            overshadowCanvas = await canvasFromPath(double_ring_overshadow_path);
        }
        shadowCanvas = await canvasFromPath(ring_inner_shadow_path);
    }
    else
    {
        // square
        if (!document.getElementById(ring_count_id).checked)
        {
            // single
            borderCanvas = await canvasFromPath(single_square_alpha_path);
            bevelCanvas = await canvasFromPath(single_square_bevel_path);
            overshadowCanvas = await canvasFromPath(single_square_overshadow_path);
        }
        else
        {
            // double
            borderCanvas = await canvasFromPath(double_square_alpha_path);
            bevelCanvas = await canvasFromPath(double_square_bevel_path);
            overshadowCanvas = await canvasFromPath(double_square_overshadow_path);
        }
        shadowCanvas = await canvasFromPath(square_inner_shadow_path);
    }
    const texCanvas = await canvasFromPath(stone_texture_path);
    // get contexts for all our component canvases
    const borderContext = borderCanvas.getContext('2d');
    const overshadowContext = overshadowCanvas.getContext('2d');
    const bevelContext = bevelCanvas.getContext('2d');
    const texContext = texCanvas.getContext('2d');
    const shadowContext = shadowCanvas.getContext('2d');
    const alphaContext = alphaCanvas.getContext('2d');
    // canvas in doc already
    const finCanvas = document.getElementById(can_out_id);
    const finContext = finCanvas.getContext('2d');
    
    // draw alpha for cropping token
    alphaContext.fillStyle = '#ffffff';
    if (!document.getElementById(border_style_id).checked)
    {
        alphaContext.arc(img_s/2, img_s/2, img_s*0.49, 0, Math.PI*2);
        alphaContext.fill();
    }
    else
    {
        alphaContext.fillRect(0, 0, img_s, img_s);
    }
    
    // clear final canvas
    token_context.clearRect(0, 0, token_canvas.width, token_canvas.height);
    
    // get colors for gradient
    let col1 = hexToRGB(document.getElementById(col1_id).value);
    let col2 = hexToRGB(document.getElementById(col2_id).value);
    // create gradient for color on ring
    const gradientCanvas = createGradient(img_s, img_s, col1, col2, GRADIENT_SCALE, GRADIENT_ANGLE);
    const gradientContext = gradientCanvas.getContext('2d');
    
    await displayArt(token_art_canvas, 1.0);
    
    // create a temporary clone of peek whiteboard
    let tempPeekCanvas = document.createElement('canvas');
    tempPeekCanvas.width = img_s;
    tempPeekCanvas.height = img_s;
    let tempPeekContext = tempPeekCanvas.getContext('2d');
    await displayArt(tempPeekCanvas, 1.0, 1);
    
    // clip token art onto whiteboard
    clipOnto(token_art_context, tempPeekContext, tempPeekCanvas.width, tempPeekCanvas.height);
    
    // create a temporary clone of peek for drop shadow
    let peekShadowCanvas = document.createElement('canvas');
    peekShadowCanvas.width = img_s;
    peekShadowCanvas.height = img_s;
    let peekShadowContext = peekShadowCanvas.getContext('2d');
    await displayArt(peekShadowCanvas, 1.0, 1);
    // turn shadow layer black
    colorOverlay(peekShadowCanvas, {r:0,g:0,b:0});
    // blur shadow layer to create drop shadow
    boxBlur(peekShadowCanvas, blur_radius);
    // clip drop shadow onto ring
    alphaMask(peekShadowContext, borderContext, img_s, img_s);
    
    // mask texture
    alphaMask(texContext, borderContext, img_s, img_s);
    
    // set bottom layer as alpha for art
    alphaContext.blendOnto(token_context, 'normal');
    // clip art onto alpha mask
    clipOnto(token_art_context, token_context, img_s, img_s);
    // blend shadow onto art
    shadowContext.blendOnto(token_context, 'multiply');
    // add gradient to ring
    clipOnto(gradientContext, borderContext, img_s, img_s);
    // add bevel to ring
    bevelContext.blendOnto(borderContext, 'hardlight');
    // add stone texture to ring
    texContext.blendOnto(borderContext, 'multiply');
    // add over shadow to ring
    overshadowContext.blendOnto(borderContext, 'overlay');
    // paste peek shadow on top of token
    peekShadowContext.blendOnto(borderContext, 'multiply');
    // paste ring onto final art
    borderContext.blendOnto(token_context, 'normal');
    // paste peek art on top of token
    tempPeekContext.blendOnto(token_context, 'normal');
    // post image to preview
    let previewImg = new Image();
    const previewPromise = new Promise ( resolve =>
    {
        previewImg.onload = function()
        {
            finContext.clearRect(0, 0, finCanvas.width, finCanvas.height);
            finContext.drawImage(previewImg, 0, 0, finCanvas.width, finCanvas.height);
            resolve();
        }
        previewImg.src = token_canvas.toDataURL();
    });
    await previewPromise;
    
    borderCanvas.remove();
    bevelCanvas.remove();
    overshadowCanvas.remove();
    texCanvas.remove();
    shadowCanvas.remove();
    alphaCanvas.remove();
    gradientCanvas.remove();
    tempPeekCanvas.remove();
    
    // set cursor to normal
    document.body.className = '';
    tokenizing = false;
}

// function to calculate offsets to center token art
function centerArt()
{
    let scale = art_base_scale*art_user_scale;
    let width = art_width*scale;
    let height = art_height*scale;
    
    art_offset_x = (img_s - width)/2;
    art_offset_y = (img_s - height)/2;
}


// function to display current token art to a canvas
// mode 0=art, 1=mask
async function displayArt(displayCan, relative_scale = 1.0, mode = 0)
{
    // get 2d context of display canvas
    const displayCtx = displayCan.getContext('2d');
    // clear display canvas
    displayCtx.clearRect(0, 0, displayCan.width, displayCan.height);
    
    // preserve composite operation
    let compOp = displayCtx.globalCompositeOperation;
    // set to draw operation so we can draw
    displayCtx.globalCompositeOperation = 'source-over';
    
    
    let scale = art_base_scale*art_user_scale;
    
    centerArt();
    
    let offsetX;
    let offsetY;
    
    // choose which canvas to draw from
    let can;
    
    if (mode == 0)
    {
        offsetX = (art_offset_x + art_offset_user_x) * relative_scale;
        offsetY = (art_offset_y + art_offset_user_y) * relative_scale;
        can = art_canvas;
    }
    else if (mode == 1)
    {
        offsetX = (art_offset_x + art_offset_user_x) * relative_scale;
        offsetY = (art_offset_y + art_offset_user_y) * relative_scale;
        can = peek_canvas;
    }
    else
    {
        console.log('ERROR: invalid mode for displayArt')
    }
    
    let tmpImg = new Image();
    const promise = new Promise ( resolve =>
    {
        tmpImg.onload = function()
        {
            displayCtx.drawImage(tmpImg, offsetX, offsetY, art_width*scale*relative_scale, art_height*scale*relative_scale);
            resolve();
        }
        tmpImg.src = can.toDataURL();
    });
    
    await promise;
    // preserve composite operation
    displayCtx.globalCompositeOperation = compOp;
}

// display art preview with overlay
async function displayPreview()
{
    // draw preview
    const previewCan = document.getElementById(can_in_id);
    const previewCtx = previewCan.getContext('2d');
    await displayArt(previewCan, rel_scale);
    const whiteboardCan = document.getElementById(whiteboard_id);
    await displayArt(whiteboardCan, rel_scale, 1);
    // draw overlay
    let ringCan;
    if (!document.getElementById(ring_count_id).checked)
    {
        ringCan = (!document.getElementById(border_style_id).checked) ? await canvasFromPath(single_ring_overlay_path) : await canvasFromPath(single_square_overlay_path);
    }
    else
    {
        ringCan = (!document.getElementById(border_style_id).checked) ? await canvasFromPath(double_ring_overlay_path) : await canvasFromPath(double_square_overlay_path);
    }
    
    let tmpImg = new Image();
    const imgPromise = new Promise ( resolve =>
    {
        tmpImg.onload = function()
        {
            const overlayCan = document.getElementById(can_overlay_id);
            const overlayCtx = overlayCan.getContext('2d');
            overlayCtx.clearRect(0, 0, overlayCan.width, overlayCan.height);
            overlayCtx.drawImage(tmpImg, 0, 0, overlayCan.width, overlayCan.height);
            resolve();
        }
        tmpImg.src = ringCan.toDataURL();
    });
    
    await imgPromise;
    
    ringCan.remove();
}

// file input handling
document.getElementById(file_id).addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function()
            {
                resetSliders();
                // calculate apropriate scale to fit
                art_width = img.naturalWidth;
                art_height = img.naturalHeight;
                if (art_width < art_height)
                {
                    art_base_scale = img_s / art_width;
                }
                else
                {
                    art_base_scale = img_s / art_height;
                }
                art_canvas.width = img.naturalWidth;
                art_canvas.height = img.naturalHeight;
                art_canvas.getContext('2d').drawImage(img, 0, 0);
                // update peek canvas
                peek_canvas.width = img.naturalWidth;
                peek_canvas.height = img.naturalHeight;
                peek_context.clearRect(0,0,peek_canvas.width,peek_canvas.height);
                document.getElementById(whiteboard_id)
                    .getContext('2d')
                    .clearRect(0, 0, img_s*rel_scale, img_s*rel_scale);
                
                displayPreview();
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
});

// function to save image to png file
async function saveImage() {
    
    // post image to resized render canvas
    let reSize = $('#'+img_size_id).val();
    resized_canvas.width = reSize;
    resized_canvas.height = reSize;
    
    let resizedImg = new Image();
    const resizePromise = new Promise ( resolve =>
    {
        resizedImg.onload = function()
        {
            resized_context.clearRect(0, 0, resized_canvas.width, resized_canvas.height);
            resized_context.drawImage(resizedImg, 0, 0, reSize, reSize);
            resolve();
        }
        resizedImg.src = token_canvas.toDataURL();
    });
    
    await resizePromise;
    
    resized_canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'token.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, $('#'+ftype_id).val());
    
    resized_canvas.remove();
}

/**
 * function to resize a canvas
 *
 * @param canvas: canvas object to resize
 * @param size: number representing new size for canvas
 */
async function resizeCanvas(canvas, size)
{
    const context = canvas.getContext('2d');
    
    let imgSrc = canvas.toDataURL();
    
    let resizedImg = new Image();
    const resizePromise = new Promise ( resolve =>
    {
        resizedImg.onload = function()
        {
            canvas.width = size;
            canvas.height = size;
            context.clearRect(0, 0, size, size);
            context.drawImage(resizedImg, 0, 0, size, size);
            resolve();
        }
        resizedImg.src = imgSrc;
    });
    
    await resizePromise;
}

/**
 * Resize canvases and underlay frame for img preview canvas
 * 
 * @param size: number size to resize canvases too
 */
async function resizeBoards(size)
{
    size = Math.max(size, MIN_CANV_S);
    size = Math.min(size, MAX_CANV_S);
    size = Math.floor(size);
    canv_s = size;
    $('#underlay').width(canv_s).height(canv_s);
    let canvases = $('canvas');
    for (let i = 0; i < canvases.length; i++)
    {
        //canvases[i].getContext('2d').canvas.width = canv_s;
        //canvases[i].getContext('2d').canvas.height = canv_s;
        await resizeCanvas(canvases[i], size);
    }
    rel_scale = canv_s/img_s;
    displayPreview();
}

let undoing = false; // track undoing process
// whiteboard undo
async function wbUndo()
{
    // check if there is anything in history or if currently trying to undo
    if (undo_whiteboard_stack.length < 1 || undoing)
    {
        return;
    }
    // mark as in progress
    undoing = true;
    
    // get current peek canvas state for redo
    let redoCan = document.createElement('canvas');
    redoCan.width = peek_canvas.width;
    redoCan.height = peek_canvas.height;
    let redoCtx = redoCan.getContext('2d')
    // reansfer peek canvas data to redo canvas
    redoCtx.putImageData(peek_context.getImageData(0,0,peek_canvas.width,peek_canvas.height),0,0);
    // add redo canvas to redo stack
    redo_whiteboard_stack.push(redoCan);
    // maintain max length of redo stack
    if (redo_whiteboard_stack.length > UNDO_STACK_SIZE)
    {
        redo_whiteboard_stack.shift();
    }
    
    // get image data canvas / data from top of stack
    const recovCan = undo_whiteboard_stack.pop();
    const recovCtx = recovCan.getContext('2d');
    const imgData = recovCtx.getImageData(0, 0, peek_canvas.width, peek_canvas.height);
    // put old image data to peek canvas
    peek_context.putImageData(imgData, 0, 0);
    
    
    // redraw preview
    await displayPreview();
    
    // mark as completed
    undoing = false;
}
// whiteboard redo
async function wbRedo()
{
    // check if there is anything in history or if currently trying to undo
    if (redo_whiteboard_stack.length < 1 || undoing)
    {
        return;
    }
    // mark as in progress
    undoing = true;
    
    // get current peek canvas state for undo
    let undoCan = document.createElement('canvas');
    undoCan.width = peek_canvas.width;
    undoCan.height = peek_canvas.height;
    let undoCtx = undoCan.getContext('2d')
    // reansfer peek canvas data to redo canvas
    undoCtx.putImageData(peek_context.getImageData(0,0,peek_canvas.width,peek_canvas.height),0,0);
    // add redo canvas to redo stack
    undo_whiteboard_stack.push(undoCan);
    // maintain max length of redo stack
    if (undo_whiteboard_stack.length > UNDO_STACK_SIZE)
    {
        undo_whiteboard_stack.shift();
    }
    
    // get image data canvas / data from top of stack
    const recovCan = redo_whiteboard_stack.pop();
    const recovCtx = recovCan.getContext('2d');
    const imgData = recovCtx.getImageData(0, 0, peek_canvas.width, peek_canvas.height);
    // put old image data to peek canvas
    peek_context.putImageData(imgData, 0, 0);
    
    // redraw preview
    await displayPreview();
    
    // mark as completed
    undoing = false;
}

$(document).ready(function() {
    // handle setting scale from slider
    $('#'+scale_id).change(function()
    {
        art_user_scale = (this.value / 100)*((MID_USER_SCALE-MIN_USER_SCALE)/0.5)+MIN_USER_SCALE;
        displayPreview();
    });
    // handle setting scale from slider
    $('#'+pan_h_id).change(function()
    {
        art_offset_user_x = (this.value * 20) - CANV_S;
        displayPreview();
    });
    // handle setting scale from slider
    $('#'+pan_v_id).change(function()
    {
        art_offset_user_y = ((100 - this.value) * 20) - CANV_S;
        displayPreview();
    });
    // number of rings on token (1/2)
    $('#'+ring_count_id).change(function() { displayPreview(); });
    // toggle border shape (square/circle)
    $('#'+border_style_id).change(function() { displayPreview(); });
    // toggle eraser mode on brush
    $('#'+erase_toggle_id).change(function()
    {
        whiteboard_erase = this.checked;
        let ctx = document.getElementById(whiteboard_id).getContext('2d');
        if (this.checked)
        {
            ctx.globalCompositeOperation = 'destination-out';
            peek_context.globalCompositeOperation = 'destination-out';
        }
        else
        {
            ctx.globalCompositeOperation = 'source-over';
            peek_context.globalCompositeOperation = 'source-over';
        }
    });
    // handle setting brush size from slider
    $('#'+brush_size_id).change(function()
    {
        // set to brush size scope
        brush_size = (this.value/100) * (MAX_BRUSH_SIZE-MIN_BRUSH_SIZE) + MIN_BRUSH_SIZE;
        $('#circular-cursor').css('height', `${brush_size*2}px`);
        $('#circular-cursor').css('width', `${brush_size*2}px`);
    });
    // set initial css values for brush cursor
    $('#circular-cursor').css('height', `${brush_size*2}px`);
    $('#circular-cursor').css('width', `${brush_size*2}px`);
    // adjust blur radius
    $('#'+blur_radius_id).change(function()
    {
        if (!isNaN(parseFloat(this.value)) && !isNaN(this.value - 0))
        {
            let r = parseInt(this.value);
            if (r > MAX_BLUR)
            {
                blur_radius = MAX_BLUR;
            }
            else
            {
                blur_radius = r;
            }
            blur_radius = Math.max(0, blur_radius);
        }
        this.value = blur_radius;
        
    });
    // tokenizer button
    $('#'+tokenize_id).click( function () { tokenize(); });
    // save/export button
    $('#'+save_id).click( function () { saveImage(); });
    // resize canvases on input
    $('#'+canvas_size_id).change( function()
    {
        resizeBoards(this.value);
        displayPreview();
    });
    // display initial preview
    displayPreview();
    
    
    // keybinds code
    $(document).keydown(function(e)
    {
        // redo (ctrl+shift+z)
        if( e.which === 90 && e.ctrlKey && e.shiftKey )
        {
            wbRedo(); 
        }
        // undo (ctrl+z)
        else if( e.which === 90 && e.ctrlKey )
        {
            wbUndo();
        }          
    }); 
    
    // whiteboard code
    const whiteboard = document.getElementById(whiteboard_id);
    const board_frame = document.getElementById('underlay');
	const whiteboardCtx = whiteboard.getContext('2d');
    
    $('#'+clear_peek_id).click( function()
    {
        whiteboardCtx.clearRect(0, 0, whiteboard.width, whiteboard.height);
        peek_context.clearRect(0, 0, peek_canvas.width, peek_canvas.height);
        displayPreview();
    });
	
    // Mouse Event Handlers
	if(whiteboard){
		var isDown = false;
		var canvasX, canvasY;
		whiteboardCtx.lineWidth = 5;
		
		$(board_frame)
		.mousedown(function(e)
        {
            // save current whiteboard state
            // create new canvas to add to queue
            let stateCan = document.createElement('canvas');
            stateCan.width = peek_canvas.width;
            stateCan.height = peek_canvas.height;
            // copy current canvas
            stateCan.getContext('2d').putImageData(peek_context.getImageData(0,0,peek_canvas.width,peek_canvas.height),0,0);
            // push to stack
            undo_whiteboard_stack.push(stateCan);
            // delete oldest if exceed max length
            if (undo_whiteboard_stack.length > UNDO_STACK_SIZE)
            {
                undo_whiteboard_stack.shift();
            }
            // clear redo stack
            redo_whiteboard_stack = [];
            
            
            // toggle mouse_down
            isDown = true;
            
            // calculate in-canvas position
            canvasX = e.pageX - board_frame.offsetLeft;
            canvasY = e.pageY - board_frame.offsetTop;
            
            // draw on main canvas
            whiteboardCtx.fillStyle = "#fff";
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(canvasX, canvasY, brush_size, 0, 2 * Math.PI);
            whiteboardCtx.fill();
            
            // calculate hidden canvas position / brush size
            let scale = 1/rel_scale/art_base_scale/art_user_scale;
            let x = (canvasX - ((art_offset_user_x + art_offset_x) * rel_scale)) * scale;
            let y = (canvasY - ((art_offset_user_y + art_offset_y) * rel_scale)) * scale;
            
            
            // draw on hidden canvas
            peek_context.fillStyle = "#fff";
            peek_context.beginPath();
            peek_context.arc(x, y, brush_size*scale, 0, 2 * Math.PI);
            peek_context.fill();
		})
		.mousemove(function(e)
        {
            // move cursor
            document.getElementById('circular-cursor').style.left = `${e.pageX - brush_size}px`
            document.getElementById('circular-cursor').style.top = `${e.pageY - brush_size}px`
			if(isDown !== false)
            {
                // calculate in-canvas position
                canvasX = e.pageX - board_frame.offsetLeft;
                canvasY = e.pageY - board_frame.offsetTop;
                
                // draw on main canvas
                whiteboardCtx.fillStyle = "#fff";
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(canvasX, canvasY, brush_size, 0, 2 * Math.PI);
                whiteboardCtx.fill();
                
                // calculate hidden canvas position / brush size
                let scale = 1/rel_scale/art_base_scale/art_user_scale;
                let x = (canvasX - ((art_offset_user_x + art_offset_x) * rel_scale)) * scale;
                let y = (canvasY - ((art_offset_user_y + art_offset_y) * rel_scale)) * scale;
                
                // draw on hidden canvas
                peek_context.fillStyle = "#fff";
                peek_context.beginPath();
                peek_context.arc(x, y, brush_size*scale, 0, 2 * Math.PI);
                peek_context.fill();
			}
		})
		.mouseup(function(e)
        {
            // toggle mouse_down position
			isDown = false;
		})
        .mouseleave(function(e)
        {
            isDown = false;
        });
	}
	
	// Touch Events Handlers
	draw = {
		started: false,
		start: function(e)
        {
			this.started = true;
            
            // save current whiteboard state
            // create new canvas to add to queue
            let stateCan = document.createElement('canvas');
            stateCan.width = peek_canvas.width;
            stateCan.height = peek_canvas.height;
            // copy current canvas
            stateCan.getContext('2d').putImageData(peek_context.getImageData(0,0,peek_canvas.width,peek_canvas.height),0,0);
            // push to stack
            undo_whiteboard_stack.push(stateCan);
            // delete oldest if exceed max length
            if (undo_whiteboard_stack.length > UNDO_STACK_SIZE)
            {
                undo_whiteboard_stack.shift();
            }
            // clear redo stack
            redo_whiteboard_stack = [];
            
		},
		move: function(e)
        {
			if (this.started && e.touches.length < 2)
            {
                e.preventDefault();
                // calculate in-canvas position
                canvasX = e.pageX - board_frame.offsetLeft;
                canvasY = e.pageY - board_frame.offsetTop;
                
                // draw on main canvas
                whiteboardCtx.fillStyle = "#fff";
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(canvasX, canvasY, brush_size, 0, 2 * Math.PI);
                whiteboardCtx.fill();
                
                // calculate hidden canvas position / brush size
                let scale = 1/rel_scale/art_base_scale/art_user_scale;
                let x = (canvasX - ((art_offset_user_x + art_offset_x) * rel_scale)) * scale;
                let y = (canvasY - ((art_offset_user_y + art_offset_y) * rel_scale)) * scale;
                
                // draw on hidden canvas
                peek_context.fillStyle = "#fff";
                peek_context.beginPath();
                peek_context.arc(x, y, brush_size*scale, 0, 2 * Math.PI);
                peek_context.fill();
			}

		},
		end: function(evt)
        {
			this.started = false;
		}
	};
	
	// Touch Events
	whiteboard.addEventListener('touchstart', draw.start, false);
	whiteboard.addEventListener('touchend', draw.end, false);
	whiteboard.addEventListener('touchmove', draw.move, false);
	
	// Disable Page Move
	document.body.addEventListener('touchmove',function(evt){
		evt.preventDefault();
	},false);
});

// CODE TO LET USER DRAG TO PAN
//let mouseDown = false;
//let cX = 0;
//let cY = 0;
//const mouse_sens = 2;
//$(document).ready(function() {
//    var val = 0;
//    $('#canvas').on('mousedown',function (e)
//    {
//        cX = e.pageX;
//        cY = e.pageY;
//        down=true;
//    });
//    $('#canvas').on("mouseleave mouseup", function ()
//    {
//        down=false;
//            displayPreview();
//    });
//    $('#canvas').on('mousemove', function(e)
//    {
//        if (down)
//        {
//            let deltaX = e.pageX - cX;
//            let deltaY = e.pageY - cY;
//            cX = e.pageX;
//            cY = e.pageY;
//            art_offset_user_x += deltaX * mouse_sens;
//            art_offset_user_y += deltaY * mouse_sens;
//        }
//    });
//});
