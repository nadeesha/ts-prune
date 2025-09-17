import { Project } from "ts-morph";
import { initialize } from "./initializer";

jest.mock("ts-morph");

const MockProject = Project as jest.MockedClass<typeof Project>;

describe("initializer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialize", () => {
    it("should create a Project with the provided tsconfig path", () => {
      const tsConfigPath = "/project/tsconfig.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      const result = initialize(tsConfigPath);

      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath
      });
      expect(result.project).toBe(mockProject);
    });

    it("should handle relative tsconfig paths", () => {
      const tsConfigPath = "./tsconfig.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      const result = initialize(tsConfigPath);

      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath
      });
      expect(result.project).toBe(mockProject);
    });

    it("should handle custom tsconfig filenames", () => {
      const tsConfigPath = "/project/tsconfig.build.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      const result = initialize(tsConfigPath);

      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath
      });
      expect(result.project).toBe(mockProject);
    });

    it("should return an object with the project property", () => {
      const tsConfigPath = "/project/tsconfig.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      const result = initialize(tsConfigPath);

      expect(result).toEqual({
        project: expect.any(MockProject)
      });
    });

    it("should handle absolute paths", () => {
      const tsConfigPath = "/absolute/path/to/tsconfig.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      initialize(tsConfigPath);

      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath
      });
    });

    it("should handle paths with special characters", () => {
      const tsConfigPath = "/project/my-app/tsconfig.json";
      const mockProject = new MockProject();
      MockProject.mockImplementation(() => mockProject);

      initialize(tsConfigPath);

      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath
      });
    });
  });
});