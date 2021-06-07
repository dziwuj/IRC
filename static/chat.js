let randomColor = Math.floor(Math.random() * 16777215).toString(16);

// Sending messages, a simple POST
function PublishForm(form, url) {

  function sendMessage(content) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
  }

  form.onsubmit = function () {
    let message = form.message.value;

    console.table({
      message: message,
      nick: nick,
      color: color
    });

    if (message) {
      let content = {
        message: message,
        nick: "@" + nick,
        color: color
      }
      form.message.value = '';
      sendMessage(content);
    }
    return false;
  };
}

// Receiving messages with long polling
function SubscribePane(elem, url) {

  function showMessage(nick, color, message) {
    let clock = new Date()
    let hours = clock.getHours().toString()
    let minutes = clock.getMinutes().toString()
    if (hours.length < 2)
      hours = "0" + hours
    if (minutes.length < 2)
      minutes = "0" + minutes

    let time = "[" + hours + ":" + minutes + "]"

    let messageElem = document.createElement('div');
    let user = document.createElement("p")
    let name = document.createTextNode(nick)
    user.appendChild(name)
    user.style.color = color
    let mess = document.createElement("p")
    let text = document.createTextNode(message)
    mess.appendChild(text)
    mess.classList.add("message")
    messageElem.append(time, "<", user, "> ", mess)
    // messageElem.append(message);
    elem.append(messageElem);
    $(".message").emoticonize({
      //delay: 800,
      //animate: false
      //exclude: 'pre, code, .no-emoticons'
    });
    var scrollbar = $scrollbar.data("plugin_tinyscrollbar")
    scrollbar.update(scrollTo = "bottom");

  }

  async function subscribe() {
    try {
      let res = await fetch(url);
      if (res.status == 502) {
        // Connection timeout
        // happens when the connection was pending for too long
        console.log("Timeout reached...");
        // let's reconnect
        await subscribe();
      } else if (res.status == 503) {
        // Show Error
        // showMessage(res.statusText);
        console.log("Heroku się sra bo request 30s+ =>" + res.statusText);
        // Reconnect in one second
        await new Promise(resolve => setTimeout(resolve, 1000));
        await subscribe();
      } else if (res.status != 200) {
        // Show Error
        showMessage(res.statusText);
        console.log("Error stats: " + res.statusText);
        // Reconnect in one second
        await new Promise(resolve => setTimeout(resolve, 1000));
        await subscribe();
      } else {
        // Got message
        let message = await res.text();
        let parsed = JSON.parse(message)
        // let color = await res.text()
        console.log(parsed);
        if (parsed.nick == "SYSTEM") {
          if (nick == parsed.who) {
            nick = parsed.new_nick
            color = parsed.new_color
            if (parsed.command == "quit") {
              window.location.reload()
            }
          }
        }
        showMessage(parsed.nick, parsed.color, parsed.message);
        await subscribe();
      }
    } catch (err) {
      console.log("err");
      // catches errors both in fetch and res.json
      // let's reconnect
      await subscribe();
    }
  }

  subscribe();

}