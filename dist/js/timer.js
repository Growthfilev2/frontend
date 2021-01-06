self.addEventListener('message', function (event) {
  if (event.data.type === 'read') {
    setInterval(function () {
      self.postMessage(event.data);
    }, 4000);
  }
});