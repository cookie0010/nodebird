const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const morgan = require("morgan");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");

dotenv.config(); // dotenv 파일 사용. 변수를 사용하기 위해선 최대한 위쪽에 위치하는 것이 좋다.
const authRouter = require("./routes/auth");
const indexRouter = require("./routes");
const v1 = require("./routes/v1");
const v2 = require("./routes/v2");
const { sequelize } = require("./models");
const passportConfig = require("./passport");
const cors = require("cors");

const app = express();
passportConfig();
app.set("port", process.env.PORT || 8002);
app.set("view engine", "html");
nunjucks.configure("views", {
	express: app,
	watch: true,
});
sequelize
	.sync({ force: false })
	.then(() => {
		console.log("데이터베이스 연결 성공");
	})
	.catch((err) => {
		console.error(err);
	});

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // json 형식을 지원하겠다
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
	session({
		resave: false,
		saveUninitialized: false,
		secret: process.env.COOKIE_SECRET,
		cookie: {
			httpOnly: true,
			secure: false,
		},
	}),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use("/auth", authRouter);
app.use("/", indexRouter);
app.use("/v1", v1);
app.use("/v2", v2);

app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
	res.status(err.status || 500);
	res.render("error");
});

app.listen(app.get("port"), () => {
	console.log(app.get("port"), "번 포트에서 대기중");
});
