// Source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

String.prototype.hashCode = function () {
    var hash = 0,
        len = this.length,
        i,
        c;

    if (this.length === 0) {
        return hash;
    }
    for (i = 0; i < len; i += 1) {
        c = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};