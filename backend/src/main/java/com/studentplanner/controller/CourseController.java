package com.studentplanner.controller;

import com.studentplanner.dto.CourseDtos.CourseRequest;
import com.studentplanner.dto.CourseDtos.CourseResponse;
import com.studentplanner.model.User;
import com.studentplanner.service.AuthService;
import com.studentplanner.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final AuthService authService;

    public CourseController(CourseService courseService, AuthService authService) {
        this.courseService = courseService;
        this.authService = authService;
    }

    @GetMapping
    public List<CourseResponse> list(@AuthenticationPrincipal UserDetails ud) {
        return courseService.listCourses(getUser(ud));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@Valid @RequestBody CourseRequest req,
                                 @AuthenticationPrincipal UserDetails ud) {
        return courseService.createCourse(req, getUser(ud));
    }

    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable Long id,
                                 @Valid @RequestBody CourseRequest req,
                                 @AuthenticationPrincipal UserDetails ud) {
        return courseService.updateCourse(id, req, getUser(ud));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        courseService.deleteCourse(id, getUser(ud));
    }

    private User getUser(UserDetails ud) {
        return authService.getCurrentUser(ud.getUsername());
    }
}
