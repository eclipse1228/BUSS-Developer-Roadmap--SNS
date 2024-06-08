/*
  비동기적으로 MongoDB에 연결을 시도하고, 
  성공하면 연결 메시지를 콘솔에 출력하며, 실패하면 에러 메시지를 출력하고 프로세스를 종료. 
  connectDB 함수는 다른 파일에서 사용할 수 있도록 모듈로 내보냄.
*/
// 모듈 가져오기
const mongoose = require("mongoose");
// const config = require("config");

// default.json 파일에서 mongoURI 값을 읽어옴
// const uri = config.get("mongoURI");

// MongoDB에 연결
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017", {
      // useUnifiedTopology: true,
      // useNewUrlParser: true,
    });

    console.log("MongoDB Connected...");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
module.exports = connectDB;