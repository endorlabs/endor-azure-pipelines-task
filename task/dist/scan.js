"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEndorctlRunOptions = void 0;
function buildEndorctlRunOptions(inputParams) {
    const options = [
        `scan`,
        `--api=${inputParams.endorAPI}`,
        `--api-key=${inputParams.apiKey}`,
        `--api-secret=${inputParams.apiSecret}`,
        `--namespace=${inputParams.namespace}`,
        `--verbose=${inputParams.logVerbose}`,
        `--log-level=${inputParams.logLevel}`,
        `--sarif-file=${inputParams.sarifFile}`,
    ];
    if (inputParams.scanDependencies) {
        options.push(`--dependencies=true`);
    }
    if (inputParams.scanTools) {
        options.push(`--tools=true`);
    }
    if (inputParams.scanSecrets) {
        options.push(`--secrets=true`);
    }
    if (inputParams.scanSast) {
        options.push(`--sast=true`);
    }
    if (inputParams.scanContainer) {
        options.push(`--container=${inputParams.image}`);
        if (inputParams.projectName) {
            options.push(`--project-name=${inputParams.projectName}`);
        }
    }
    if (inputParams.scanPackage) {
        options.push(`--package=true`);
        if (inputParams.projectName) {
            options.push(`--project-name=${inputParams.projectName}`);
        }
    }
    if (inputParams.phantomDependencies) {
        options.push(`--phantom-dependencies=true`);
    }
    if (inputParams.scanGitLogs && inputParams.scanSecrets) {
        options.push(`--git-logs=true`);
    }
    if (inputParams.tags) {
        options.push(`--tags=${inputParams.tags}`);
    }
    if (inputParams.scanPath) {
        options.push(`--path=${inputParams.scanPath}`);
    }
    if (inputParams.additionalParameters) {
        const additionalOptions = inputParams.additionalParameters.split(" ");
        if (additionalOptions.length > 0) {
            options.push(...additionalOptions);
        }
    }
    return options;
}
exports.buildEndorctlRunOptions = buildEndorctlRunOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zY2FuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLFNBQWdCLHVCQUF1QixDQUNyQyxXQUE0QjtJQUU1QixNQUFNLE9BQU8sR0FBRztRQUNkLE1BQU07UUFDTixTQUFTLFdBQVcsQ0FBQyxRQUFRLEVBQUU7UUFDL0IsYUFBYSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ2pDLGdCQUFnQixXQUFXLENBQUMsU0FBUyxFQUFFO1FBQ3ZDLGVBQWUsV0FBVyxDQUFDLFNBQVMsRUFBRTtRQUN0QyxhQUFhLFdBQVcsQ0FBQyxVQUFVLEVBQUU7UUFDckMsZUFBZSxXQUFXLENBQUMsUUFBUSxFQUFFO1FBQ3JDLGdCQUFnQixXQUFXLENBQUMsU0FBUyxFQUFFO0tBQ3hDLENBQUM7SUFFRixJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRTtRQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7S0FDckM7SUFFRCxJQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUU7UUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUM5QjtJQUVELElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtRQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEM7SUFFRCxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUU7UUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUM3QjtJQUVELElBQUksV0FBVyxDQUFDLGFBQWEsRUFBRTtRQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDakQsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1NBQzNEO0tBQ0Y7SUFFRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUU7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9CLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtZQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztTQUMzRDtLQUNGO0lBRUQsSUFBSSxXQUFXLENBQUMsbUJBQW1CLEVBQUU7UUFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQzdDO0lBRUQsSUFBSSxXQUFXLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUU7UUFDdEQsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUM1QztJQUVELElBQUksV0FBVyxDQUFDLFFBQVEsRUFBRTtRQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDaEQ7SUFFRCxJQUFJLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRTtRQUNwQyxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEUsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3BDO0tBQ0Y7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBcEVELDBEQW9FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElucHV0UGFyYW1ldGVycyB9IGZyb20gXCIuL2lucHV0LXBhcmFtZXRlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRW5kb3JjdGxSdW5PcHRpb25zKFxuICBpbnB1dFBhcmFtczogSW5wdXRQYXJhbWV0ZXJzXG4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBbXG4gICAgYHNjYW5gLFxuICAgIGAtLWFwaT0ke2lucHV0UGFyYW1zLmVuZG9yQVBJfWAsXG4gICAgYC0tYXBpLWtleT0ke2lucHV0UGFyYW1zLmFwaUtleX1gLFxuICAgIGAtLWFwaS1zZWNyZXQ9JHtpbnB1dFBhcmFtcy5hcGlTZWNyZXR9YCxcbiAgICBgLS1uYW1lc3BhY2U9JHtpbnB1dFBhcmFtcy5uYW1lc3BhY2V9YCxcbiAgICBgLS12ZXJib3NlPSR7aW5wdXRQYXJhbXMubG9nVmVyYm9zZX1gLFxuICAgIGAtLWxvZy1sZXZlbD0ke2lucHV0UGFyYW1zLmxvZ0xldmVsfWAsXG4gICAgYC0tc2FyaWYtZmlsZT0ke2lucHV0UGFyYW1zLnNhcmlmRmlsZX1gLFxuICBdO1xuXG4gIGlmIChpbnB1dFBhcmFtcy5zY2FuRGVwZW5kZW5jaWVzKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLWRlcGVuZGVuY2llcz10cnVlYCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhblRvb2xzKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLXRvb2xzPXRydWVgKTtcbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy5zY2FuU2VjcmV0cykge1xuICAgIG9wdGlvbnMucHVzaChgLS1zZWNyZXRzPXRydWVgKTtcbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy5zY2FuU2FzdCkge1xuICAgIG9wdGlvbnMucHVzaChgLS1zYXN0PXRydWVgKTtcbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy5zY2FuQ29udGFpbmVyKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLWNvbnRhaW5lcj0ke2lucHV0UGFyYW1zLmltYWdlfWApO1xuICAgIGlmIChpbnB1dFBhcmFtcy5wcm9qZWN0TmFtZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKGAtLXByb2plY3QtbmFtZT0ke2lucHV0UGFyYW1zLnByb2plY3ROYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy5zY2FuUGFja2FnZSkge1xuICAgIG9wdGlvbnMucHVzaChgLS1wYWNrYWdlPXRydWVgKTtcbiAgICBpZiAoaW5wdXRQYXJhbXMucHJvamVjdE5hbWUpIHtcbiAgICAgIG9wdGlvbnMucHVzaChgLS1wcm9qZWN0LW5hbWU9JHtpbnB1dFBhcmFtcy5wcm9qZWN0TmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMucGhhbnRvbURlcGVuZGVuY2llcykge1xuICAgIG9wdGlvbnMucHVzaChgLS1waGFudG9tLWRlcGVuZGVuY2llcz10cnVlYCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhbkdpdExvZ3MgJiYgaW5wdXRQYXJhbXMuc2NhblNlY3JldHMpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tZ2l0LWxvZ3M9dHJ1ZWApO1xuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLnRhZ3MpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tdGFncz0ke2lucHV0UGFyYW1zLnRhZ3N9YCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhblBhdGgpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tcGF0aD0ke2lucHV0UGFyYW1zLnNjYW5QYXRofWApO1xuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLmFkZGl0aW9uYWxQYXJhbWV0ZXJzKSB7XG4gICAgY29uc3QgYWRkaXRpb25hbE9wdGlvbnMgPSBpbnB1dFBhcmFtcy5hZGRpdGlvbmFsUGFyYW1ldGVycy5zcGxpdChcIiBcIik7XG4gICAgaWYgKGFkZGl0aW9uYWxPcHRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIG9wdGlvbnMucHVzaCguLi5hZGRpdGlvbmFsT3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG4iXX0=