// Mock de las funciones encadenadas de Supabase
// 1. Definir las funciones mock que se usarán en las pruebas.
// Deben declararse antes de jest.mock y de las importaciones.
const mockSingle = jest.fn();
const mockReturns = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ returns: mockReturns });
const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit, returns: mockReturns });
const mockIn = jest.fn().mockReturnValue({ order: mockOrder, limit: mockLimit, returns: mockReturns });
const mockEq = jest.fn().mockReturnValue({ single: mockSingle, order: mockOrder, limit: mockLimit, returns: mockReturns });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq, in: mockIn, order: mockOrder, limit: mockLimit });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq, select: mockSelect });

const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
});


// Mock del cliente principal de Supabase
// 2. Mockear el módulo. Jest "hoists" (mueve) esta llamada al principio del todo.
// Por eso, las variables que usa deben estar definidas antes.
jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn().mockImplementation(() => ({
      from: mockFrom,
    })),
  };
});

// 3. Ahora, importar la clase a probar.
// Esta importación recibirá la versión "mockeada" de '@supabase/supabase-js'.
import { SupabaseRepository } from '../src/infrestructure/adapter/SupabaseRepository';

describe('SupabaseRepository', () => {
  type TestEntity = { id?: number; name?: string; activo?: boolean };
  let repository: SupabaseRepository<TestEntity>;
  const tableName = 'test_table';
  const pkName = 'test_id';

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba para asegurar el aislamiento.
    jest.clearAllMocks();
    // El constructor de SupabaseRepository ahora usará el createClient mockeado.
    repository = new SupabaseRepository(tableName, pkName);
  });

  describe('saveData', () => {
    it('should save data and return the saved entity', async () => {
      const entity = { name: 'test' };
      const savedEntity = { id: 1, ...entity };
      mockSelect.mockResolvedValueOnce({ data: [savedEntity], error: null });

      const result = await repository.saveData(entity);

      expect(mockFrom).toHaveBeenCalledWith(tableName);
      expect(mockInsert).toHaveBeenCalledWith([entity]);
      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(savedEntity);
    });

    it('should throw an error if save fails', async () => {
      const entity = { name: 'test' };
      const dbError = new Error('Insert failed');
      mockSelect.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(repository.saveData(entity)).rejects.toThrow(dbError.message);
    });
  });

  describe('getAll', () => {
    it('should get all records with columns and filters', async () => {
      const mockData = [{ id: 1, name: 'test1' }, { id: 2, name: 'test2' }];
      mockReturns.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await repository.getAll(['id', 'name'], { name: 'test1', ids: [1, 2] }, 'id', true);

      expect(mockFrom).toHaveBeenCalledWith(tableName);
      expect(mockSelect).toHaveBeenCalledWith('id,name');
      expect(mockEq).toHaveBeenCalledWith('name', 'test1');
      expect(mockIn).toHaveBeenCalledWith('ids', [1, 2]);
      expect(mockOrder).toHaveBeenCalledWith('id', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should apply a limit to the query', async () => {
        mockReturns.mockResolvedValueOnce({ data: [], error: null });
        await repository.getAll(['*'], { limit: '10' });

        expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw an error if getAll fails', async () => {
      const dbError = new Error('Select failed');
      mockReturns.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(repository.getAll(['*'], {})).rejects.toThrow(`Error al consultar la tabla '${tableName}': ${dbError.message}`);
    });
  });

  describe('getData', () => {
    it('should get a single record by id', async () => {
        const mockRecord = { id: 1, name: 'single_record' };
        const mockSingleSelectEq = jest.fn().mockResolvedValue({ data: [mockRecord], error: null });
        const mockSingleSelect = jest.fn().mockReturnValue({ eq: mockSingleSelectEq });
        mockFrom.mockReturnValue({ select: mockSingleSelect });

        const result = await repository.getData(1);

        expect(mockSingleSelect).toHaveBeenCalledWith('*');
        expect(mockSingleSelectEq).toHaveBeenCalledWith('id', 1);
        expect(result).toEqual(mockRecord);
    });
  });

  describe('updateData', () => {
    it('should update a record by id', async () => {
      const entityToUpdate = { name: 'updated_name' };
      mockSelect.mockResolvedValueOnce({ data: [entityToUpdate], error: null });

      const result = await repository.updateData(1, entityToUpdate);

      expect(mockFrom).toHaveBeenCalledWith(tableName);
      expect(mockUpdate).toHaveBeenCalledWith(entityToUpdate);
      expect(mockEq).toHaveBeenCalledWith(pkName, 1);
      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual([entityToUpdate]);
    });


    it('should throw an error if update fails', async () => {
      const dbError = new Error('Update failed');
      mockSelect.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(repository.updateData(1, {})).rejects.toThrow(dbError.message);
    });

  });

  describe('deleteData', () => {
    it('should perform a soft delete by setting activo to false', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await repository.deleteData(1);

      expect(mockFrom).toHaveBeenCalledWith(tableName);
      expect(mockUpdate).toHaveBeenCalledWith({ activo: false });
      expect(mockEq).toHaveBeenCalledWith(pkName, 1);
    });


    it('should throw an error if delete fails', async () => {
      const dbError = new Error('Delete failed');
      mockEq.mockResolvedValueOnce({ error: dbError });

      await expect(repository.deleteData(1)).rejects.toThrow(dbError.message);
    });

  });
});
