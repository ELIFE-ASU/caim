const {Frame} = require('../src/images');
const Jimp = require('jimp');

test('Frame requires positive width', function() {
    expect(() => new Frame(-1, 5)).toThrow(Error);
    expect(() => new Frame(0, 5)).toThrow(Error);
});

test('Frame requires positive height', function() {
    expect(() => new Frame(5, -1)).toThrow(Error);
    expect(() => new Frame(5, 0)).toThrow(Error);
});

test('Frame constructs correctly', function() {
    const f = new Frame(3, 5);
    expect(f.data).toHaveLength(15);
    expect(f.width).toBe(3);
    expect(f.height).toBe(5);
});

test('Frame.from_image', async function() {
    let img = await new Jimp(4,2);
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        if (idx == 4 || idx == 12 || idx == 24 || idx == 28) {
            this.bitmap.data[idx + 1] = 0xff;
        }
        this.bitmap.data[idx + 3] = 0x0;
    });

    let frame = Frame.from_image(img),
        data = Buffer.from([0, 0xff, 0, 0xff, 0, 0, 0xff, 0xff]);

    expect(frame.data).toEqual(data);
    expect(frame.width).toBe(4);
    expect(frame.height).toBe(2);
});
