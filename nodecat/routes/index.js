const express = require("express");
const axios = require("axios");

const router = express.Router();
const URL = "http://localhost:8002/v2";

axios.defaults.headers.origin = "http://localhost:4000";
const request = async (req, api) => {
	try {
		if (!req.session.jwt) {
			// 세션에 토큰이 없으면 토큰 발급 시도
			const tokenResult = await axios.post(`${URL}/token`, {
				clientSecret: process.env.CLIENT_SECRET,
			});
			req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
		}
		// req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
		return await axios.get(`${URL}${api}`, {
			headers: { authorization: req.session.jwt },
		});
	} catch (err) {
		console.error(err);
		if (err.response.status === 419) {
			// 토큰 만료시
			delete req.session.jwt; // 토큰 삭제하고
			return request(req, api); // request 다시 실행
		}
		return err.response;
	}
};

router.get("/mypost", async (req, res, next) => {
	try {
		const result = await request(req, "/posts/my");
		res.json(result.data);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

router.get("/search/:hashtag", async (req, res, next) => {
	try {
		const result = await request(
			req,
			`/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
		);
		res.json(result.data);
	} catch (err) {
		console.error(err);
		next(err);
	}
});
module.exports = router;
