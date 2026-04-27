

// trying new things to see if it works and if it does then we can use it in the future 

import { KeyObject } from "crypto";
import { Bakbak_One } from "next/font/google";

// the new value is the new value that we are trying to get and the old value is the old value that we are trying to get
export function getNewerValues(value: number): boolean { 
    if (value > 90 && value < 100) {
        return true;
    }
    if (value > 100) {  
        // check if the new value is a valid number
        if(isNaN(value)) {
            return false;
        }
        return true;
    }
    return false;
}

export function getOlderValues(value: number): boolean {
    if (value < 10 && value > 0) {
        return true;
    }
    return false;
}
export function getValues(value: number): boolean {
    if (value > 90 && value < 100) {
        return true;
    }
    return false;
}
export function getupperValues(value: number): boolean {
    if (value > 100) {
        return true;
    }
    return false;
}
export function getlowervalues(value: number) : boolean{
    if( value < 100){
        return true;
    }
    return false;
}

export function getvalues(value: number): boolean {
    if (value > 10 && value < 90) { // this is the value that we are trying to get
        return true;
    }
    return false;
}   
export function getvalues2(value: number): boolean {
    if(value > 10 && value < 90) {
        return true;
    }
    return false;
}

export function getuppervalues(value: number): boolean {
    if(value > 100) {
        return true;
    }
    return false;
}
export function getlowervalues2(value: number): boolean {
    if(value < 10) {
        return true;
    }
    return false;
}
export function getvalues4(value: number): boolean {
    if(value > 10 && value < 90) {
        return true;
    }
    return false;
} 
export function getvalues5(value:number):boolean{
    if(value > 100){
        return true; 
    }
    return false;
}
export function getvalues6(value:number):boolean{
    if(value < 10){
        return true;
    }
    return false;
}
export function getvalues7(value:number):boolean{
    if(value > 10 && value < 90){
        return true;
    }
    return false;
}
export function getvalues8(value:number):boolean{
if (value){
    return true;
     
}
    return false;
}

export function getvaluesss(value:number):boolean{
    if(value < 100){
        return true;
    }
    return false;
}
export function getvaluess(value: number):boolean{
    if(value > 100){
        return true;
    }
    return false;
}




