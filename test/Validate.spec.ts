import { expect } from 'chai';
import { parseJSON, validateNode } from '../src'
import { isRight, right, isLeft, left } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import * as c from '../src/Chain'
import {IParamAny} from '../src/Types'
import { either } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';

describe('Validate', () => {
    it('errors if invalid json', () => {
        const n = parseJSON(``)
        expect(isLeft(n)).to.be.true
        expect(pipe(
            n,
            either.fold(t.identity, JSON.stringify))).to.equal("Unexpected end of JSON input")
    });
    it('can be validated', ()=> {
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(
            n,
            either.map(n => n.type),
            either.fold(t.identity, t.identity))).to.equal("waveCHOP")
    });
    // it('errors if invalid', () => {
    //     let jsonn = JSON.stringify({
    //         family: "ha",
    //         type: 2,
    //         params: "test",
    //         connections: []
    //     })
    //     const n = parseJSON(jsonn)
    //     expect(n.mapLeft(n => n[0]).fold<any>(t.identity, t.identity)).to.equal("Invalid value \"ha\" supplied to : Node/family: (\"TOP\" | \"CHOP\" | \"MAT\" | \"SOP\" | \"COMP\")/0: \"TOP\"")
    // });
    it('errors if type doesn\'t exist', () =>{
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "notaCHOP",
            params: {},
            connections: []
        })
        const n = parseJSON(jsonn)
    });
    it('errors if type is incorrect', () => {
        let jsonn = JSON.stringify({
            family: "TOP",
            type: "waveCHOP",
            params: {},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("type 'TOP' is not correct for 'waveCHOP'")
    });
    it('can have params', ()=> {
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {"rate" : { type: "float", value0: ["1.0"]}},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.map(n => (<IParamAny>n.params["rate"]).value0[0]),
            either.fold(t.identity, t.identity))).to.equal("1.0")
    });
    it('can have number param', ()=> {
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {"rate" : 1 },
            connections: []
        })
        const n = parseJSON(jsonn)
        console.log(n)
        expect(pipe(n,
            either.map(n => (<IParamAny>n.params["rate"])),
            either.fold<string, IParamAny, any>(t.identity, t.identity))).to.equal(1)
    });
    it('can have string param', ()=> {
        let jsonn = JSON.stringify({
            family: "TOP",
            type: "textTOP",
            params: {"text" : "hi" },
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.map(n => (<IParamAny>n.params["text"])),
            either.fold<string, IParamAny, any>(t.identity, t.identity))).to.equal("hi")
    });
    it('can have multivalue params', ()=> {
        let jsonn = JSON.stringify({
            family: "TOP",
            type: "rectangleTOP",
            params: {"size": { type: "xy", value0: ["0.5"], value1:["0.75"]}},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.map(n => n.params["size"]['value1'][0]),
            either.fold(t.identity, t.identity))).to.equal("0.75")
    });
    it('errors if param doesn\'t exist', () =>{
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {"notaparam": {type: "string", value0: ["nope"] }},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("param 'notaparam' does not exist for type 'waveCHOP'")
    });
    it('errors if param is the wrong type', () =>{
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {"rate": { type: "string", value0: ["1.0"]} } ,
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("param type is not correct for 'waveCHOP.rate'")
    });
    it('can have children', ()=> {
        let child = {
            family: "TOP",
            type: "rectangleTOP",
            params: {},
            connections: []
        }
        let child2 = {
            family: "TOP",
            type: "circleTOP",
            params: {},
            connections: []
        }
        let comp = {
            family: "TOP",
            type: "compositeTOP",
            params: { "operand": { type: "menu", value0: ["31"]} },
            connections: [child, child2]
        }
        let jsonn = JSON.stringify({
            family: "TOP",
            type: "blurTOP",
            params: {},
            connections: [comp ]
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.map(n => n.connections[0].connections[1].type),
            either.fold(t.identity, t.identity))).to.equal("circleTOP")
    });
    // it('errors if child is invalid', () =>{
    //     let child = {
    //         family: "TOP",
    //         type: "waveTOP",
    //         params: {}
    //     }
    //     let child2 = {
    //         family: "TOP",
    //         type: "waveTOP",
    //         params: {},
    //         connections: [child]
    //     }
    //     let jsonn = JSON.stringify({
    //         family: "CHOP",
    //         type: "waveCHOP",
    //         params: {},
    //         connections: [child2]
    //     })
    //     const n = parseJSON(jsonn)
    //     expect(n.mapLeft(n => n[0]).fold<any>(t.identity, t.identity)).to.equal("Invalid value undefined supplied to : Node/connections: Array<Node>/0: Node/connections: Array<Node>/0: Node/connections: Array<Node>")
    // });
    it('errors if child type is invalid', () =>{
        let child = {
            family: "TOP",
            type: "blurTOP",
            params: {},
            connections: []
        }
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {},
            connections: [child]
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("too many inputs for node 'waveCHOP'")
    });
    it('errors if second child is invalid', () =>{
        let child = {
            family: "CHOP",
            type: "waveCHOP",
            params: {},
            connections: []
        }
        let child2 = {
            family: "TOP",
            type: "blurTOP",
            params: {},
            connections: []
        }
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {"rate": { type: "string", value0: ["1.0"]}},
            connections: [child, child2]
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("param type is not correct for 'waveCHOP.rate'")
    });
    it('errors if too many children', () =>{
        let child = {
            family: "CHOP",
            type: "waveCHOP",
            params: {},
            connections: []
        }
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "waveCHOP",
            params: {},
            connections: [child]
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("too many inputs for node 'waveCHOP'")
    });
    it('errors if too few children', () =>{
        let jsonn = JSON.stringify({
            family: "CHOP",
            type: "audiofilterCHOP",
            params: {},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("too few inputs for node 'audiofilterCHOP'")
    });
    it('errors if param node errors', () =>{

        let par = {
            family: "CHOP",
            type: "audiofilterCHOP",
            params: {},
            connections: []
        }
        let jsonn = JSON.stringify({
            family: "TOP",
            type: "choptoTOP",
            params: {"chop": {type: "CHOP", value0: ['"', par, '"']}},
            connections: []
        })
        const n = parseJSON(jsonn)
        expect(pipe(n,
            either.fold(t.identity, JSON.stringify))).to.equal("too few inputs for node 'audiofilterCHOP'")
    });
    it('doesn\'t error on base comp params', () =>{

        let vol = c.chan(c.ip(0), c.chope("audiodevicein")
            .connect(c.chop("select", {channames: c.sp("chan1")}))
            .connect(c.chop("resample", {"timeslice": c.tp(false), "method": c.mp(0), "relative": c.mp(0), "end": c.fp(0.03)}))
            .connect(c.chop("math", {"gain": c.fp(2)})).connect(c.chop('analyze', {"function": c.mp(6)})).runT())
        let n = c.comp("base", Object.assign({externaltox: c.sp("test")}, {Test: vol}))
        expect(pipe(
            validateNode(n.out()),
            either.map(n => n.type),
            either.fold(t.identity, t.identity))).to.equal("baseCOMP")
    })
});