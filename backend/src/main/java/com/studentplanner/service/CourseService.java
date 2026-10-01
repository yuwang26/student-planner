package com.studentplanner.service;

import com.studentplanner.dto.CourseDtos.CourseRequest;
import com.studentplanner.dto.CourseDtos.CourseResponse;
import com.studentplanner.model.Course;
import com.studentplanner.model.User;
import com.studentplanner.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<CourseResponse> listCourses(User user) {
        return courseRepository.findByUserIdOrderByNameAsc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest req, User user) {
        Course course = new Course(req.name(), req.description(), req.color(), user);
        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest req, User user) {
        Course course = findOwned(id, user);
        course.setName(req.name());
        course.setDescription(req.description());
        course.setColor(req.color());
        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long id, User user) {
        Course course = findOwned(id, user);
        courseRepository.delete(course);
    }

    public Course findOwned(Long id, User user) {
        return courseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private CourseResponse toResponse(Course c) {
        return new CourseResponse(c.getId(), c.getName(), c.getDescription(), c.getColor(),
                c.getHomeworkList().size());
    }
}
