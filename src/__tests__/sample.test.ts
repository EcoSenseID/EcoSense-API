// @ts-nocheck
describe('Sample Test', () => {
  it('Testing to see if Jest works', () => {
    expect(1).toBe(1);
  })
});

// describe('MD API Test', () => {
//     it('Test Level Logic when Point = 2800', () => {
//       const levelExp = [100, 120, 140, 170, 210, 250, 300, 360, 430, 520, 620, 740, 890, 1070, 1280, 1540, 1850, 2220, 2660, 3190];
//       let currentPoint = 2800;
//       let cLevel = 0;
//       let idx = 0;
//       for (let i = 0; i < levelExp.length; i++) {
//           if (currentPoint < levelExp[i]) {
//               break;
//           } else {
//               cLevel += 1;
//               currentPoint -= levelExp[i];
//               idx += 1;
//           }
//       }

//       const levelExperience = idx === levelExp.length ? 9999 : levelExp[idx];
//       expect(currentPoint).toBe(200);
//       expect(cLevel).toBe(10);
//       expect(levelExperience).toBe(620);
//     });

//     it('Test Level Logic when Point reached max level', () => {
//       const levelExp = [100, 120, 140, 170, 210, 250, 300, 360, 430, 520, 620, 740, 890, 1070, 1280, 1540, 1850, 2220, 2660, 3190];
//       let currentPoint = 19000;
//       let cLevel = 0;
//       let idx = 0;
//       for (let i = 0; i < levelExp.length; i++) {
//           if (currentPoint < levelExp[i]) {
//               break;
//           } else {
//               cLevel += 1;
//               currentPoint -= levelExp[i];
//               idx += 1;
//           }
//       }

//       const levelExperience = idx === levelExp.length ? 9999 : levelExp[idx];
//       expect(currentPoint).toBe(340);
//       expect(cLevel).toBe(20);
//       expect(levelExperience).toBe(9999);
//     })
// });