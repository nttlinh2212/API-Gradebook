import excelToJson from 'convert-excel-to-json';




// async function uploadListStudent(path,sheet) {
//     console.log(path,"/",sheet)
//     const result = excelToJson({
//         sourceFile: path,
//         header:{
//             rows: 1
//         },
//         sheets: [sheet],
//         columnToKey: {
//             A: 'studentId',
//             B: 'fullName'
//         }
//     });
//     return result.sheet;
// }

// export default uploadListStudent;