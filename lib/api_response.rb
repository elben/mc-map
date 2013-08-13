class ApiResponse
  class << self
    def success(data={})
      {:status => "success", :data => data}
    end

    # When an API call is rejected due to invalid data or call conditions.
    def fail(data={})
      {:status => "fail", :data => data}
    end

    # Failure due to server error.
    def error(message)
      {:status => "error", :message => message}
    end
  end
end

