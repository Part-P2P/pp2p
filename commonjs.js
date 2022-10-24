var CommonJS = {
    makeEvent: function(target, name, data) {
        target = target ?? document;
        data = data ?? {};
        if (name == null || name.length < 1) return;
        var event = new CustomEvent(name, data);
        target.dispatchEvent(event);
    }
}
