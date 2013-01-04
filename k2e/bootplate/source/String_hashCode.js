// Source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    var len = this.length;
    for (var i = 0; i < len; ++i) {
        var c = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};