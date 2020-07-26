import _ from "lodash";
import { Dimensions } from "react-native";
import { Animal, Result, Stanby, Box, Join } from "./renderers";
import { socket } from "../socket";

let hideTime = 15000;
let watchCount = 5;
let menberList;
let hideFlg;
let roomId = undefined;
let endFlg;
let winner = [];
let stanbyFlg = false;
let stanbyCount = 5;
let autoFlg;
let resultFlg = true;

const defaultHideTime = 15000;
const { width, height } = Dimensions.get("window");
const animalSize = Math.trunc(Math.max(width, height) * 0.045);
const buttonSize = Math.trunc(Math.max(width, height) * 0.2);
const joinSize = Math.trunc(Math.max(width, height) * 0.2);

socket.on('connect', () => {
	console.log( 'connect : socket.id = %s', socket.id );
});

socket.on('update',(ht,wc,ml,hf,ri,ef,wn,sf,sc,af) => {
	hideTime = ht;
	watchCount = wc;
	menberList = ml;
	hideFlg = hf;
	roomId = ri;
	endFlg = ef;
	winner = wn
	stanbyFlg = sf;
	stanbyCount = sc;
	autoFlg = af;
});

const Login = (name) => {
	socket.emit('login', name);
}

const UpDate = (state) => {
	// joinButton処理
	if(endFlg){
		if(!state.join){
			state.join = { 
				body: {position: { x: width / 2, y: height * ( 6 / 10)}}, 
				size: [joinSize, joinSize], 
				color: "pink", 
				renderer: Join, 
			}
		}
	} else {
		if(state.join){
			delete state.join;
		}
	}
	// stanbyCount処理
	if(stanbyFlg){
		if(!state.stanby){
			state.stanby = {
				body: {position: { x: width / 2, y: height / 4 }},
				size: [width, buttonSize],
				count: stanbyCount,
				animation: 'bounceIn',
				renderer: Stanby,
			}
		} else {
			if(state.stanby.count !== stanbyCount){
				if(stanbyCount === 0){
					state.stanby.count = 'START!';
				} else {
					state.stanby.count = stanbyCount;
				}
			}
		}
	} else {
		if(state.stanby){
			delete state.stanby;
		}
	}
	// hidetime処理
	if(state.floor.hideTime !== hideTime){
		state.floor.hideTime = hideTime;
		state.floor.size[0] = width * ( hideTime / defaultHideTime);
	}
	if(state.watchCount.text !== watchCount){
		state.watchCount.text = watchCount;
	}
	// 結果表示
	if(winner.length){
		// if(!state.result){
		if(!resultFlg){
			resultFlg = true;
			state.result.isVisible = true;
			//  = {
				// body: {position: { x: width / 2, y: height / 4 }},
				// size: [width, buttonSize],
				// role: winner[0],
				// name: winner[1],
				// animation: 'bounceIn',
				// isVisible: true,
				// renderer: Result,
			// };
		}
		if(state.result.isVisible){
			state.result.isVisible = false;
		}
		// }
	}else {
		if(resultFlg){
			resultFlg = false;
		}
		if(state.result.isVisible){
			state.result.isVisible = false;
		}
		// if(state.result){delete state.result}
	}
	// updateループ処理
	if(menberList){
		let currentId = Object.keys(menberList);
		for(let i = 0; i < currentId.length; i++){
			let id = currentId[i];
			if(menberList[id].join){
				if(state[id]){
					if(menberList[id].watcher){
						if(state[id].role === 'toucher'){
							state[id].role = 'watcher';
							state[id].angle = 3.14159 + 'rad',
							state[id].body = {position: { x: width / 2, y: height * (1 / 13) }};
							state[id].size = [animalSize * 2, animalSize * 2];
						}
						if(hideFlg){
							if(state[id].angle !== '0rad'){
								state[id].angle = 0 + 'rad';
							}
						} else {
							if(state[id].angle !== '3.14159rad'){
								state[id].angle = 3.14159 + 'rad';
							}
						}
					} else {
						if(menberList[id].distance >= 0){
							if(state[id].distance !== menberList[id].distance){
								state[id].distance = menberList[id].distance;
								state[id].body.position.y = height * ((menberList[id].distance + 580) / 5800);
								state[id].body.position.x = width * ((500 + (state[id].widPos * (menberList[id].distance / 4000))) / 1000);
							}
						}
					}
				} else {
					if(menberList[id].watcher){
						state[id] = {
							id: id,
							role: 'watcher',
							body: {position: { x: width / 2, y: height * (1 / 13) }},
							size: [animalSize * 2, animalSize * 2],
							text: menberList[id].name,
							angle: 3.142 + 'rad',
							renderer: Animal,
						};
					} else {
						let randPos = Math.floor(Math.random() * 1000) + 1;
						let widPos = randPos - 500;
						let angle = Math.atan2(
									(width * (randPos / 1000)) - (width / 2),
									(height * (8 / 10)) - height * (1 / 13),
									) * -1;
						state[id] = {
							id: id,
							role: 'toucher',
							widPos: widPos,
							distance: 0,
							body: {position: { x: width * (randPos / 1000), y: height * (8 / 10) }},
							size: [animalSize, animalSize],
							text: menberList[id].name,
							angle: angle + 'rad',
							renderer: Animal,
						};
					}
				}
			} else {
				if(state[id]){delete state[id]}
			}
		}
		// menberListにないstateを削除
		let currentState = Object.keys(state);
		for(let i = 0; i < currentState.length; i++){
			let stateId = currentState[i];
			if(state[stateId].id){
				if(currentId.indexOf(stateId) === -1){
					delete state[stateId];
				}
			}
		}
	}
	return state;
}

export { UpDate, Login, socket };