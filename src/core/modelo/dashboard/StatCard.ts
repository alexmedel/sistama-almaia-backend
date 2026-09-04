import { Stat } from "./Stat";

export class StatCard {
    title: string;
    count: number;
    stats: Stat[];
    className: string;
    textColor: string;
    constructor(){
        this.title = '';
        this.count = 0;
        this.stats = [];
        this.className = '';
        this.textColor = '';
    }
  }