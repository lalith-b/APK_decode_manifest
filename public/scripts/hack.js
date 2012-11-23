// random numbers that look like GUIDs - http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function S4()   { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
function guid() { return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()); }
var upload_uuid = undefined;

function update_progress() {
  var uri = '/progress/'+upload_uuid;
  var file = $("input:file").val();

  $.getJSON(uri, function(data) {
    progress = data['progress'];
    if (progress) {
      if (progress < 100.0) {
        $('#progress').html('Uploading: '+progress+"% "+file);
    	$("#progress").progressbar({ value: progress });
      } else {
        $('#progress').html(''); // clear when done.
		$("#progress").progressbar({ value: progress });
      }
    }
    if (progress != 100.0) {
      setTimeout("update_progress()", 200);
    }
  });
}

$(document).ready(function() {
  $('#decrypt_apk').click(function(e) {
    var file = $("input:file").val();
	var ext = file.split('.').pop();
    if ((file == '') || (typeof file == undefined) || (ext != 'apk')) {
      $('#progress').css({background: 'none repeat scroll 0 0 #FF3300', color:'#FFFFFF'});
      $('#progress').html('Input proper APK/ Android application package file')
    } else {
      // ok.
      $('#progress').css({background: 'none', color:'#000000'});
      $('#progress').html('Uploading: 0% ' + file);
      // TODO: disable submit button.
		
	  document.getElementById('decrypt_apk').disabled = true;

      // submit form in hidden iframe.
      upload_uuid = guid();
      var iframe = $('<iframe name="postframe" id="postframe" class="hidden" src="about:none" />');
      $('div#target').html(iframe);
      $('#uploadform').attr('target', 'postframe');
      $('#uploadform').attr('action', '/upload/'+upload_uuid);
      $('#uploadform').submit();
      update_progress();

      $('#postframe').load(function() {
        var status = $('#postframe')[0].contentDocument.body.textContent;
        $('div#progress').html(status);
        // post title back to server
        uri = '/update/'+upload_uuid;
        $.post(uri, {'title': $('#title').val()})
      });

    }
  })
});
