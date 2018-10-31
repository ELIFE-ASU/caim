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

test('Frame.from', async function() {
    let img = await new Jimp(4,2);
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        if (idx == 4 || idx == 12 || idx == 24 || idx == 28) {
            this.bitmap.data[idx + 1] = 0xff;
        }
        this.bitmap.data[idx + 3] = 0x0;
    });

    let frame = Frame.from(img),
        data = Buffer.from([0, 0xff, 0, 0xff, 0, 0, 0xff, 0xff]);

    expect(frame.data).toEqual(data);
    expect(frame.width).toBe(4);
    expect(frame.height).toBe(2);
});

test('Frame.to_image', async function() {
    let frame = new Frame(4, 2);
    [1, 3, 6, 7].forEach(function(i) {
        frame.data[i] = 0xff;
    });

    let img = await frame.to_image(),
        data = Buffer.from([
            0,0,0,0xff,0xff,0xff,0xff,0xff,0,0,0,0xff,0xff,0xff,0xff,0xff,
            0,0,0,0xff,0,0,0,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
        ]);

    expect(img.bitmap.data).toEqual(data);
    expect(img.bitmap.width).toEqual(4);
    expect(img.bitmap.height).toEqual(2);
});

test('Frame.to_frame(frame.to_image()) == frame', async function() {
    let expected = new Frame(4, 2);
    [1, 3, 6, 7].forEach(function(i) {
        expected.data[i] = 0xff;
    });

    let got = await expected.to_image().then(Frame.from);

    expect(got.data).toEqual(expected.data);
    expect(got.width).toEqual(expected.width);
    expect(got.height).toEqual(expected.height);
});
