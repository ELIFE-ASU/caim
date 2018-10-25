const Frame = function(width, height) {
    if (width < 1 || height < 1) {
        throw new Error(`invalid frame dimensions ${width}x${height}`);
    }

    this.data = new Buffer(width * height);
    this.width = width;
    this.height = height;
};

module.exports = Frame;
