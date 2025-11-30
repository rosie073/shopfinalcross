from playwright.sync_api import sync_playwright

def verify_admin_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Mock the AuthService to return an admin user
        # We need to intercept the request to the auth.js module or its dependencies.
        # Since these are ES modules, it's tricky to mock imports directly in the browser.
        # Instead, we will intercept the file request and serve a modified version.

        # Original content of auth.js (simplified for regex replacement if needed,
        # but here we'll just replace the whole file content for the intercept)
        mock_auth_js = """
        const mockUser = {
            email: 'admin@test.com',
            getIdTokenResult: async () => ({
                claims: { isAdmin: true }
            })
        };

        export const AuthService = {
            signUp: async () => ({ user: mockUser, error: null }),
            login: async () => ({ user: mockUser, error: null }),
            logout: async () => ({ success: true, error: null }),
            observeAuth: (callback) => {
                // Immediately callback with admin user
                callback(mockUser);
            },
            checkAdminStatus: async (user) => {
                return true;
            }
        };
        """

        page.route("**/js/services/auth.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body=mock_auth_js
        ))

        # 2. Mock DBService to return some products so the table isn't empty
        mock_db_js = """
        export const DBService = {
            getAllProducts: async () => {
                return [
                    { id: 1, brand: "TestBrand", name: "Test Product 1", price: 100, img: "/img/fea1.png" },
                    { id: "auto-id-123", brand: "NewBrand", name: "Auto ID Product", price: 200, img: "/img/fea2.png" }
                ];
            },
            addProduct: async (data) => { console.log("Mock add", data); },
            updateProduct: async (id, data) => { console.log("Mock update", id, data); },
            deleteProduct: async (id) => { console.log("Mock delete", id); },
            uploadProductImage: async (file) => { return "/img/fea3.png"; }
        };
        """

        page.route("**/js/services/db.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body=mock_db_js
        ))

        # 3. Navigate to Admin Dashboard
        try:
            # Wait a bit for server to start
            page.goto("http://localhost:3000/html/admin.html")

            # 4. Wait for table to populate
            page.wait_for_selector("#productTableBody tr")

            # 5. Click "Add Product" to show modal
            page.click("#addProductBtn")
            page.wait_for_selector("#productModal", state="visible")

            # 6. Type something in the form to show it works
            page.fill("#brand", "My Brand")
            page.fill("#name", "My Cool Product")

            # Take screenshot
            page.screenshot(path="verification/admin_dashboard.png")
            print("Screenshot saved to verification/admin_dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take screenshot anyway to see what happened
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_admin_dashboard()
