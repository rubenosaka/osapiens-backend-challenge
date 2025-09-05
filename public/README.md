# 🚀 Workflow Dashboard

Web dashboard for monitoring workflows and tasks in real-time for the Backend Coding Challenge.

## 📋 Features

- **Real-time monitoring** of workflows and tasks
- **System statistics** (total workflows, tasks, states)
- **Workflow creation** directly from the interface
- **Expandable details** for each workflow
- **Auto-refresh** every 3 seconds
- **Responsive design** and modern
- **Intuitive interface** with colors and icons

## 🎯 Functionality

### 📊 Statistics Panel

- Total workflows
- Total tasks
- Completed workflows
- Workflows in progress

### 📝 Workflow Creation

- Form to create new workflows
- Pre-configured GeoJSON for testing
- Data validation
- Immediate feedback

### 🔍 Workflow Monitoring

- List of all active workflows
- Visual state with colors
- Progress bar
- Task counters by state
- Expandable details for each workflow

### 📋 Task Details

- Task list per workflow
- State of each task
- Dependencies between tasks
- Results of completed tasks
- Real-time progress

## 🚀 How to use

1. **Start the server**:

   ```bash
   npm start
   ```

2. **Open the dashboard**:

   ```
   http://localhost:3000/dashboard.html
   ```

3. **Create a workflow**:

   - Fill the form with Client ID and GeoJSON
   - Click "Create Workflow"
   - See the workflow appear in the list

4. **Monitor progress**:
   - Workflows update automatically
   - Click on a workflow to see details
   - Observe real-time progress

## 🔧 API Endpoints

The dashboard uses these endpoints:

- `GET /api/stats` - System statistics
- `GET /api/workflows` - Workflow list
- `GET /api/workflows/:id/tasks` - Tasks for a workflow
- `GET /api/workflows/:id/details` - Complete workflow details
- `POST /analysis` - Create new workflow

## 🎨 Design

- **Theme**: Blue-purple gradient
- **Typography**: Segoe UI
- **Colors**:
  - ✅ Completed: Green
  - 🔄 In progress: Yellow
  - ❌ Failed: Red
  - ⏳ Queued: Gray
- **Responsive**: Adaptable to mobiles and tablets
- **Animations**: Smooth transitions and hover effects

## 🔄 Auto-refresh

- **Interval**: 3 seconds
- **Toggle**: Can be activated/deactivated
- **Manual**: Manual refresh button
- **Indicators**: Loading states and error handling

## 📱 Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobiles and tablets
- ✅ Responsive design

---

**Developed for the Backend Coding Challenge - All 6 tasks completed** ✅
