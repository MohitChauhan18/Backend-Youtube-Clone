# QuickManage App

QuickManage is a task management app developed using Flutter. The app allows users to manage tasks efficiently with a clean, responsive UI. This project focuses on providing a smooth and interactive experience while implementing all the required features as per the provided assignment documentation.

## Features

- **User Registration:** 
  - New users cannot be created in the backend. To register, use the provided credentials:
    - **Email:** `george.bluth@reqres.in`
    - **Password:** `cityslicka`

- **User Login:** 
  - Log in using the predefined credentials:
    - **Email:** `eve.holt@reqres.in`
    - **Password:** `pisto`
  - Once logged in, users will remain logged in based on the saved token from the previous session.

- **Task Management:**
  - **Task Creation:** 
    - Tasks created are added to the local list for user interaction. However, they are not updated on the server due to API limitations. Tasks will not persist if the app is restarted, as they are stored temporarily.
  - **Task Update:** 
    - Tasks retrieved from the API can be updated. However, locally created tasks cannot be updated due to server limitations.
  - **Task Filtering:** 
    - Use the orange button at the top of the page to filter tasks assigned to you or all users.
  - **Task Search:** 
    - Search tasks from the drawer using either the title or description.

- **User Logout:** 
  - Users can log out from the drawer.

## Technologies Used

- **Flutter:** For building the UI and managing app state.
- **Provider:** For state management.
- **Screen Utils:** For creating a responsive UI.
- **Lottie JSONs:** For animations.

## Folder Structure

- **Api:**
  - Contains the models required in the app.
  - `ApiService.dart` handles all API calls.

- **Const:**
  - Contains custom widgets in the `Widgets` folder.
  - `color.dart` defines the color palette used throughout the app.

- **Provider:**
  - Contains all the provider files for state management and functions performed in the app.

- **Screens:**
  - Contains all the UI components or view files.

## Limitations

- The app is fixed in portrait mode due to time constraints and UI design considerations.
- Given the limited time (2 days), extensive testing and additional UI enhancements were not possible. The focus was on implementing all key features within the given timeframe.

## Conclusion

I have made every effort to build the app as smooth and interactive as possible while covering all the required features. I hope you find the app meets your expectations.

## Installation

To run the app on your local machine:

1. Clone this repository:
   ```bash
   git clone https://github.com/ToushikBanik123/QuickManage.git
   ```
2. Navigate to the project directory:
   ```bash
   cd QuickManage
   ```
3. Install the dependencies:
   ```bash
   flutter pub get
   ```
4. Run the app:
   ```bash
   flutter run
   ```

## Screenshots

*Include screenshots of your app here to give viewers a visual representation of the UI and features.*

## Contact

If you have any questions or feedback, feel free to reach out:

- **Email:** toushikbanikofficial@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/toushikbanik/
