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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zY2FuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLFNBQWdCLHVCQUF1QixDQUNyQyxXQUE0QjtJQUU1QixNQUFNLE9BQU8sR0FBRztRQUNkLE1BQU07UUFDTixTQUFTLFdBQVcsQ0FBQyxRQUFRLEVBQUU7UUFDL0IsYUFBYSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ2pDLGdCQUFnQixXQUFXLENBQUMsU0FBUyxFQUFFO1FBQ3ZDLGVBQWUsV0FBVyxDQUFDLFNBQVMsRUFBRTtRQUN0QyxhQUFhLFdBQVcsQ0FBQyxVQUFVLEVBQUU7UUFDckMsZUFBZSxXQUFXLENBQUMsUUFBUSxFQUFFO1FBQ3JDLGdCQUFnQixXQUFXLENBQUMsU0FBUyxFQUFFO0tBQ3hDLENBQUM7SUFFRixJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRTtRQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7S0FDckM7SUFFRCxJQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUU7UUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUM5QjtJQUVELElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtRQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEM7SUFFRCxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUU7UUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUM3QjtJQUVELElBQUksV0FBVyxDQUFDLGFBQWEsRUFBRTtRQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDakQsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1NBQzNEO0tBQ0Y7SUFFRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUU7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9CLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtZQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztTQUMzRDtLQUNGO0lBRUQsSUFBSSxXQUFXLENBQUMsbUJBQW1CLEVBQUU7UUFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQzdDO0lBRUQsSUFBSSxXQUFXLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUU7UUFDdEQsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUM1QztJQUVELElBQUksV0FBVyxDQUFDLFFBQVEsRUFBRTtRQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDaEQ7SUFFRCxJQUFJLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRTtRQUNwQyxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEUsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3BDO0tBQ0Y7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBcEVELDBEQW9FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElucHV0UGFyYW1ldGVycyB9IGZyb20gXCIuL2lucHV0LXBhcmFtZXRlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRW5kb3JjdGxSdW5PcHRpb25zKFxuICBpbnB1dFBhcmFtczogSW5wdXRQYXJhbWV0ZXJzLFxuKTogc3RyaW5nW10ge1xuICBjb25zdCBvcHRpb25zID0gW1xuICAgIGBzY2FuYCxcbiAgICBgLS1hcGk9JHtpbnB1dFBhcmFtcy5lbmRvckFQSX1gLFxuICAgIGAtLWFwaS1rZXk9JHtpbnB1dFBhcmFtcy5hcGlLZXl9YCxcbiAgICBgLS1hcGktc2VjcmV0PSR7aW5wdXRQYXJhbXMuYXBpU2VjcmV0fWAsXG4gICAgYC0tbmFtZXNwYWNlPSR7aW5wdXRQYXJhbXMubmFtZXNwYWNlfWAsXG4gICAgYC0tdmVyYm9zZT0ke2lucHV0UGFyYW1zLmxvZ1ZlcmJvc2V9YCxcbiAgICBgLS1sb2ctbGV2ZWw9JHtpbnB1dFBhcmFtcy5sb2dMZXZlbH1gLFxuICAgIGAtLXNhcmlmLWZpbGU9JHtpbnB1dFBhcmFtcy5zYXJpZkZpbGV9YCxcbiAgXTtcblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhbkRlcGVuZGVuY2llcykge1xuICAgIG9wdGlvbnMucHVzaChgLS1kZXBlbmRlbmNpZXM9dHJ1ZWApO1xuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLnNjYW5Ub29scykge1xuICAgIG9wdGlvbnMucHVzaChgLS10b29scz10cnVlYCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhblNlY3JldHMpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tc2VjcmV0cz10cnVlYCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhblNhc3QpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tc2FzdD10cnVlYCk7XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhbkNvbnRhaW5lcikge1xuICAgIG9wdGlvbnMucHVzaChgLS1jb250YWluZXI9JHtpbnB1dFBhcmFtcy5pbWFnZX1gKTtcbiAgICBpZiAoaW5wdXRQYXJhbXMucHJvamVjdE5hbWUpIHtcbiAgICAgIG9wdGlvbnMucHVzaChgLS1wcm9qZWN0LW5hbWU9JHtpbnB1dFBhcmFtcy5wcm9qZWN0TmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaW5wdXRQYXJhbXMuc2NhblBhY2thZ2UpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tcGFja2FnZT10cnVlYCk7XG4gICAgaWYgKGlucHV0UGFyYW1zLnByb2plY3ROYW1lKSB7XG4gICAgICBvcHRpb25zLnB1c2goYC0tcHJvamVjdC1uYW1lPSR7aW5wdXRQYXJhbXMucHJvamVjdE5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLnBoYW50b21EZXBlbmRlbmNpZXMpIHtcbiAgICBvcHRpb25zLnB1c2goYC0tcGhhbnRvbS1kZXBlbmRlbmNpZXM9dHJ1ZWApO1xuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLnNjYW5HaXRMb2dzICYmIGlucHV0UGFyYW1zLnNjYW5TZWNyZXRzKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLWdpdC1sb2dzPXRydWVgKTtcbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy50YWdzKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLXRhZ3M9JHtpbnB1dFBhcmFtcy50YWdzfWApO1xuICB9XG5cbiAgaWYgKGlucHV0UGFyYW1zLnNjYW5QYXRoKSB7XG4gICAgb3B0aW9ucy5wdXNoKGAtLXBhdGg9JHtpbnB1dFBhcmFtcy5zY2FuUGF0aH1gKTtcbiAgfVxuXG4gIGlmIChpbnB1dFBhcmFtcy5hZGRpdGlvbmFsUGFyYW1ldGVycykge1xuICAgIGNvbnN0IGFkZGl0aW9uYWxPcHRpb25zID0gaW5wdXRQYXJhbXMuYWRkaXRpb25hbFBhcmFtZXRlcnMuc3BsaXQoXCIgXCIpO1xuICAgIGlmIChhZGRpdGlvbmFsT3B0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBvcHRpb25zLnB1c2goLi4uYWRkaXRpb25hbE9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcHRpb25zO1xufVxuIl19