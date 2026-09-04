 
export interface ISupabaseRepository <T>{
    saveData(entity: T, userId?: string): Promise<void>;
    getData(id: number): Promise<any>;
    deleteData(id: number): Promise<any>;
    updateData(id:number,data: T): Promise<any>;
  }