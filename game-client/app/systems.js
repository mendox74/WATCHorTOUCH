import _ from "lodash";
import { Box } from "./renderers";
import Matter from "matter-js";
import io from "socket.io-client";

const socket = io('http://192.168.11.7:8080', {transports: ['websocket']} );

let boxIds = 0;
let box = null;

let hideTime = 15000;
let watchCount = 5;
let menberList;
let winner;
let hideFlg;
let roomId = undefined;
let endFlg;

socket.on('connect', () => {
	console.log( 'connect : socket.id = %s', socket.id );
});

socket.on('update',(ht,wc,ml,win,hf,ri,ef,) => {
	hideTime = ht;
	watchCount = wc;
	menberList = ml;
	winner = win;
	hideFlg = hf;
	roomId = ri;
	endFlg = ef;
});

const UpDate = (state, {screen}) => {
	state.floor.size[0] = hideTime / 40;
	state.watchCount.text = watchCount;
	if(menberList){
		if(menberList[socket.id].name){
			state.roomId.text = menberList[socket.id].name;
		}
		if(menberList[socket.id].distance){
			state.number.text = menberList[socket.id].distance;
			state.box.body.position.y = menberList[socket.id].distance / 8;
		}
	}
	return state;
}

const SendBox = (state, {screen}) => {
	let world = state["physics"].world;
	let boxSize = Math.trunc(Math.max(screen.width, screen.height) * 0.075);

	if(box){
		let body = Matter.Bodies.rectangle(
			...box,
			boxSize,
			boxSize,
			{ frictionAir: 0.021 }
		);
		Matter.World.add(world, [body]);

		state[++boxIds] = {
			body: body,
			size: [boxSize, boxSize],
			color: boxIds % 2 == 0 ? "pink" : "#B8E986",
			renderer: Box
		};
	}

	box = null;
	return state;
}


const distance = ([x1, y1], [x2, y2]) =>
	Math.sqrt(Math.abs(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));

const Physics = (state, { touches, time }) => {
	let engine = state["physics"].engine;

	Matter.Engine.update(engine, time.delta);

	return state;
};

const CreateBox = (state, { touches, screen }) => {

	touches.filter(t => t.type === "press").forEach(t => {
		let Pos = [t.event.pageX, t.event.pageY];
		let join = state.join.body;
		if(distance([join.position.x, join.position.y], Pos) < 25){
			socket.emit('login', 'TEST');
			socket.emit('join');
			socket.emit('reset');
			socket.emit('auto');
		}
	});

	return state;
};

const MoveBox = (state, { touches }) => {
	let start = touches.find(x => x.type === "start");

	if (start) {
		let startPos = [start.event.pageX, start.event.pageY];
		let body = state.catchButton.body;
		if(distance([body.position.x, body.position.y], startPos) < 50){
			socket.emit('move');
		}
	}

	let end = touches.find(x => x.type === "end");
	if (end) {
		socket.emit('stop');
	}

	return state;
};

const CleanBoxes = (state, { touches, screen }) => {
	let world = state["physics"].world;

	Object.keys(state)
		.filter(key => state[key].body && state[key].body.position.y > screen.height * 2)
		.forEach(key => {
			Matter.Composite.remove(world, state[key].body);
			delete state[key];
		});

	return state;
};

export { Physics, CreateBox, MoveBox, CleanBoxes, SendBox, UpDate };