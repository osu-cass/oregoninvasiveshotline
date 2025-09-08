/**
 * Resizes an image element so that it fits within a maximum width and height
 * while preserving aspect ratio.
 *
 * @param {HTMLImageElement} img - The image element to resize.
 * @returns {string} A data URL representing the resized image in JPEG format.
 */
function resizeImage(img) {
    const MAX_WIDTH = 1920.0;
    const MAX_HEIGHT = 1080.0;

    let width = img.width;
    let height = img.height;

    const canvas = $('<canvas>');
    canvas.css({ "display": "none" });
    $('body').append(canvas);

    const scale = Math.min(MAX_HEIGHT / height, MAX_WIDTH / width);
    if (scale < 1) {
        height *= scale;
        width *= scale;
    }

    canvas.attr('width', width);
    canvas.attr('height', height);

    const raw_canvas = canvas.get(0);
    const ctx = raw_canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const dataurl = raw_canvas.toDataURL("image/jpeg");
    canvas.remove();

    return dataurl;
}

$(document).ready(function () {
    // bail out if the browser doesn't support the filereader
    try {
        new FileReader();
    } catch (e) {
        return;
    }

    // whenever an image is selected, resize it and generate a preview of it
    $('#images').on('change', 'input[type="file"]', function (e) {
        const files = $(this).get(0).files;
        $('#previews').html("");

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = function (index, element, e) {
                    const append_to = element.closest(".formset-row").find(".preview");
                    const encoded_image = element.closest(".formset-row").find(".datauri");
                    const preview = $("<img />");

                    append_to.html(preview);
                    preview.attr('src', this.result);

                    preview.on("load", function () {
                        encoded_image.val(resizeImage(preview.get(0)));
                        preview.attr("width", 100);

                        // remove the input element, so the full sized image isn't POSTed
                        element.remove();
                    });
                }.bind(reader, i, $(this));
                reader.readAsDataURL(file);
            }
        }
    });
});
