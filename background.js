var scheduler = require("node-schedule")
Schedule();


function Schedule() {
	scheduler.scheduleJob('*/5 * * * * *', function () {
		notifyMe("test");
	});
}

function notifyMe(msg, url) {
	if (!Notification) {
		alert('Desktop notifications not available in your browser. Try Chromium.');
		return;
	}
	if (Notification.permission !== "granted")
		Notification.requestPermission();
	else {
		var notification = new Notification('test', {
			body: msg,
		});
    };

}

