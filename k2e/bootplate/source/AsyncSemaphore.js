enyo.kind({
    name: "AsyncSemaphore",
    kind: "enyo.Component",
    published: {
        lock: 0,
        func: undefined
    },
    v: function () {
        this.lock += 1;
    },
    p: function () {
        this.lock -= 1;
        if (this.lock === 0 && this.func) {
            this.func();
        }
    }
});