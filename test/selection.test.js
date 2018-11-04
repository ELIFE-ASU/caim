const {Point, BoundingBox} = require('../src/selection');

test('Point throws', function() {
    expect(() => Point()).toThrow(Error);
    expect(() => Point(0)).toThrow(Error);
    Point(1,2);
});

test('Point stores coordinates', function() {
    let p = Point(1, 2);
    expect(p.x).toBe(1);
    expect(p.y).toBe(2);
});

test('BoundingBox initializes', function() {
    let tests = [
        { a: Point(0,0), b: Point(0,0), expect: { tl: Point(0,0), br: Point(0,0) } },
        { a: Point(0,1), b: Point(0,1), expect: { tl: Point(0,1), br: Point(0,1) } },
        { a: Point(0,1), b: Point(1,0), expect: { tl: Point(0,0), br: Point(1,1) } },
        { a: Point(1,0), b: Point(0,1), expect: { tl: Point(0,0), br: Point(1,1) } },
        { a: Point(0,0), b: Point(1,1), expect: { tl: Point(0,0), br: Point(1,1) } },
    ];

    tests.forEach(function(test) {
        expect(BoundingBox(test.a, test.b)).toMatchObject(test.expect);
    });
});

test('BoundingBox has correct width', function() {
    let tests = [
        { box: BoundingBox(Point(0,0), Point(0,0)), width: 0 },
        { box: BoundingBox(Point(0,0), Point(0,1)), width: 0 },
        { box: BoundingBox(Point(0,0), Point(1,0)), width: 1 },
        { box: BoundingBox(Point(0,0), Point(1,1)), width: 1 }
    ];

    tests.forEach(function(test) {
        expect(test.box.width).toBe(test.width);
    });
});

test('BoundingBox has correct height', function() {
    let tests = [
        { box: BoundingBox(Point(0,0), Point(0,0)), height: 0 },
        { box: BoundingBox(Point(0,0), Point(0,1)), height: 1 },
        { box: BoundingBox(Point(0,0), Point(1,0)), height: 0 },
        { box: BoundingBox(Point(0,0), Point(1,1)), height: 1 }
    ];

    tests.forEach(function(test) {
        expect(test.box.height).toBe(test.height);
    });
});
