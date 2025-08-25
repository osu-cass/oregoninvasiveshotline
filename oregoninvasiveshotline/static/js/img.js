function resizeImage(img){
    /*
    Returns the image element as a dataurl resized to be at most 800x600
    */
    var MAX_WIDTH = 1920.0;
    var MAX_HEIGHT = 1080.0;

    var width = img.width;
    var height = img.height;
    var canvas = $('<canvas>');
    canvas.css({"display": "none"})
    $('body').append(canvas)
    var scale = Math.min(MAX_HEIGHT/height, MAX_WIDTH/width)
    if(scale < 1){
        height *= scale;
        width *= scale;
    }

    canvas.attr('width', width);
    canvas.attr('height', height);

    var raw_canvas = canvas.get(0);
    var ctx = raw_canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height)
    var dataurl = raw_canvas.toDataURL("image/jpeg");
    canvas.remove()
    return dataurl
}

$(document).ready(function(){
    // bail out if the browser doesn't support the filereader
    try {
        new FileReader();
    } catch(e) {
        return
    }

    // whenever an image is selected, resize it and generate a preview of it
    $('#images').on('change', 'input[type="file"]', function(e){
        var files = $(this).get(0).files;
        $('#previews').html("");

        for(var i = 0; i < files.length; i++){
            var file = files[i];
            if(file){
                var reader = new FileReader();
                reader.onloadend = function(index, element, e) {
                    var append_to = element.closest(".formset-row").find(".preview");
                    var encoded_image = element.closest(".formset-row").find(".datauri");
                    var preview = $("<img />");
                    append_to.html(preview);
                    preview.attr('src', this.result);
                    preview.on("load", function(){
                        encoded_image.val(resizeImage(preview.get(0)))
                        preview.attr("width", 100)
                        // remove the input element, so the full sized image
                        // isn't POSTed
                        element.remove()
                    })
                }.bind(reader, i, $(this))
                reader.readAsDataURL(file);
            }
        }
    })
});
