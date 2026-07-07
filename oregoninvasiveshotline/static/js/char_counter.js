// Live "used / max" character counter beneath
// each report-form textarea with a maxlength
$(document).ready(function () {
    $('#reports-form textarea[maxlength]').each(function () {
        var max = $(this).attr('maxlength');
        var counter = $('<div/>', {'class': 'form-text text-end'});
        $(this).after(counter);

        var update = function (value) {
            counter.text(value.length + ' / ' + max);
        };

        update($(this).val());

        $(this).on('input', function () {
            update($(this).val());
        });
    });
});
